import { Injectable, Logger } from '@nestjs/common';
import { ErrorCode, type GeoPointDto, type ManeuverDto, type RouteGeometryDto } from '@roadtalk/contracts';
import { z } from 'zod';

import { env } from '../../infrastructure/config/env';
import { AppException } from '../../infrastructure/errors/app-exception';
import { decodePolyline6 } from './decode-polyline6';
import { mapValhallaManeuverType } from './maneuver-type';
import { mergeLegPaths } from './merge-leg-paths';

// "motorcycle", pas "auto" : coûts de circulation différents (ex. accès aux
// voies interdites aux voitures dans certains pays), vérifié dans les
// fixtures de test officielles de Valhalla plutôt que supposé par analogie
// avec "auto" — https://github.com/valhalla/valhalla/blob/master/test_requests/motorcycle.txt
const COSTING_PROFILE = 'motorcycle';

// Réponse Valhalla réelle : beaucoup plus de champs que ceux qui nous
// intéressent (maneuvers, admin, etc.). On ne valide que ce qu'on lit —
// donnée externe non fiable, comme pour Photon.
//
// D'après la documentation officielle (docs/docs/api/route/api-reference.md,
// section "HTTP status codes and conditions") : un 2xx n'arrive QUE quand un
// trajet est trouvé — "trip" n'existe pas du tout dans une réponse d'erreur.
// L'absence de chemin entre les deux points est un HTTP 400, avec un corps
// distinct portant le code interne 442 ("No path could be found for input").
// `type` reste un nombre brut ici (l'enum Valhalla, voir maneuver-type.ts) —
// la traduction vers l'enum du contrat se fait après décodage, pas dans ce
// schéma dont le seul rôle est de valider la forme de la réponse externe.
const valhallaManeuverSchema = z.object({
  type: z.number(),
  instruction: z.string(),
  street_names: z.array(z.string()).optional(),
  begin_shape_index: z.number().int().nonnegative(),
  // Présent uniquement sur la manœuvre d'entrée dans un rond-point — vérifié
  // contre l'instance Valhalla locale (Place Charles de Gaulle, Paris).
  roundabout_exit_count: z.number().int().positive().optional(),
});

const valhallaRouteResponseSchema = z.object({
  trip: z.object({
    summary: z.object({
      length: z.number(), // kilomètres
      time: z.number(), // secondes
    }),
    legs: z
      .array(
        z.object({
          shape: z.string(),
          maneuvers: z.array(valhallaManeuverSchema),
        }),
      )
      .min(1),
  }),
});

// Le 400 recouvre aussi des erreurs de notre côté (costing inconnu, requête
// mal formée) — seul ce code interne signifie spécifiquement "aucun chemin
// entre ces points", pas une requête invalide.
const valhallaErrorResponseSchema = z.object({
  error_code: z.number().optional(),
  error: z.string().optional(),
});
const VALHALLA_ERROR_CODE_NO_PATH_FOUND = 442;

const KM_TO_METERS = 1000;

// 0 plutôt qu'une valeur intermédiaire : vérifié contre le moteur réel
// (Paris–Lyon, 466 km/14353 s sans l'option contre 478 km/24335 s avec) —
// une valeur > 0 laisserait Valhalla reprendre l'autoroute dès qu'elle
// raccourcit suffisamment le trajet, ce qui contredit l'intention explicite
// de l'utilisateur d'éviter complètement les autoroutes et voies rapides.
const USE_HIGHWAYS_AVOIDED = 0;

@Injectable()
export class ValhallaRouter {
  private readonly logger = new Logger(ValhallaRouter.name);

  // `waypoints` : au moins origine + une destination. Chaque point
  // intermédiaire (un arrêt) devient une étape "break" pour Valhalla, qui
  // renvoie alors un "leg" par segment plutôt qu'un seul trajet continu.
  async computeRoute(
    waypoints: readonly GeoPointDto[],
    avoidHighways?: boolean,
  ): Promise<RouteGeometryDto> {
    const url = new URL('/route', env.VALHALLA_URL);

    const response = await this.fetchRoute(url, waypoints, avoidHighways);
    const trip = response.trip;

    if (trip.legs.length === 0) {
      // Défendu par le .min(1) du schéma, mais noUncheckedIndexedAccess
      // oblige à le vérifier explicitement.
      throw new AppException(ErrorCode.ROUTING_PROVIDER_UNAVAILABLE);
    }

    // Décodé une fois, réutilisé à la fois pour le tracé fusionné et pour
    // situer chaque manœuvre : `begin_shape_index` est relatif au shape de
    // SON leg, jamais à `path` fusionné (qui a retiré des points de jonction
    // en double) — le résoudre ici, avant fusion, évite tout recalcul
    // d'index après coup.
    const legPaths = trip.legs.map((leg) => decodePolyline6(leg.shape));
    const maneuvers = trip.legs.flatMap((leg, legIndex) => {
      const legPath = legPaths[legIndex];
      if (legPath === undefined) {
        return [];
      }

      return leg.maneuvers.flatMap((maneuver): ManeuverDto[] => {
        const point = legPath[maneuver.begin_shape_index];
        if (point === undefined) {
          // Ne devrait pas arriver (Valhalla renvoie des index valides pour
          // son propre shape) — ignorer cette manœuvre plutôt que de faire
          // échouer tout l'itinéraire pour un repère de guidage en moins.
          return [];
        }

        const streetName = maneuver.street_names?.[0];
        const roundaboutExitNumber = maneuver.roundabout_exit_count;

        return [
          {
            type: mapValhallaManeuverType(maneuver.type),
            instruction: maneuver.instruction,
            point,
            ...(streetName !== undefined ? { streetName } : {}),
            ...(roundaboutExitNumber !== undefined ? { roundaboutExitNumber } : {}),
          },
        ];
      });
    });

    return {
      distanceMeters: trip.summary.length * KM_TO_METERS,
      durationSeconds: trip.summary.time,
      path: mergeLegPaths(legPaths),
      maneuvers,
    };
  }

  private async fetchRoute(
    url: URL,
    waypoints: readonly GeoPointDto[],
    avoidHighways: boolean | undefined,
  ): Promise<z.infer<typeof valhallaRouteResponseSchema>> {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locations: waypoints.map((point) => ({ lat: point.latitude, lon: point.longitude, type: 'break' })),
          costing: COSTING_PROFILE,
          // Instructions de manœuvre déjà en français — jamais reformulées
          // côté client (voir maneuverSchema dans le contrat partagé).
          language: 'fr-FR',
          ...(avoidHighways === true
            ? { costing_options: { motorcycle: { use_highways: USE_HIGHWAYS_AVOIDED } } }
            : {}),
        }),
      });
    } catch (error) {
      // Jamais les coordonnées dans les logs : elles décrivent un trajet
      // réel de l'utilisateur (C4).
      this.logger.error('Moteur de routage injoignable', error);
      throw new AppException(ErrorCode.ROUTING_PROVIDER_UNAVAILABLE);
    }

    const body: unknown = await response.json();

    if (!response.ok) {
      const parsedError = valhallaErrorResponseSchema.safeParse(body);
      if (parsedError.success && parsedError.data.error_code === VALHALLA_ERROR_CODE_NO_PATH_FOUND) {
        throw new AppException(ErrorCode.ROUTE_NOT_FOUND);
      }

      // error_code/error sont un diagnostic générique de Valhalla (ex. "No
      // suitable edges near location"), jamais les coordonnées de la requête
      // — sans risque pour C4, et bien plus exploitable qu'un simple code HTTP.
      const reason = parsedError.success
        ? `${String(parsedError.data.error_code)} — ${parsedError.data.error ?? '(pas de message)'}`
        : '(corps de réponse non conforme)';
      this.logger.error(`Moteur de routage en erreur (HTTP ${String(response.status)}) : ${reason}`);
      throw new AppException(ErrorCode.ROUTING_PROVIDER_UNAVAILABLE);
    }

    const parsed = valhallaRouteResponseSchema.safeParse(body);
    if (!parsed.success) {
      this.logger.error('Réponse du moteur de routage non conforme');
      throw new AppException(ErrorCode.ROUTING_PROVIDER_UNAVAILABLE);
    }

    return parsed.data;
  }
}
