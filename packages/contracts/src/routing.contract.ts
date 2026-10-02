import { z } from 'zod';

import { geoPointSchema } from './route.contract';

// Requête de routage à la demande — pas un itinéraire enregistré (voir
// routeSchema pour ça). Séquence ordonnée : le premier point est l'origine
// (la position de l'utilisateur), chaque point suivant un arrêt à visiter
// dans cet ordre — au minimum origine + une destination.
export const routingQuerySchema = z.object({
  waypoints: z.array(geoPointSchema).min(2),
  // Absent = comportement par défaut du moteur de routage (autoroutes
  // autorisées). Optionnel plutôt que `boolean` avec valeur par défaut : la
  // sémantique "non précisé" doit rester distincte de "false" côté serveur.
  avoidHighways: z.boolean().optional(),
});

export type RoutingQueryDto = z.infer<typeof routingQuerySchema>;

// Regroupement volontairement plus grossier que l'enum interne de Valhalla
// (30+ valeurs, ex. distinguer sortie/bretelle/insertion) : chaque valeur
// ici correspond à une icône et une présentation distinctes côté guidage,
// pas à chaque nuance que le moteur de routage sait exprimer. Le détail fin
// reste dans `instruction` (texte déjà généré en français par Valhalla).
export const maneuverTypeSchema = z.enum([
  'start',
  'continue',
  'slight-right',
  'right',
  'sharp-right',
  'slight-left',
  'left',
  'sharp-left',
  'uturn',
  'roundabout',
  'merge',
  'ferry',
  'destination',
]);

export type ManeuverType = z.infer<typeof maneuverTypeSchema>;

export const maneuverSchema = z.object({
  type: maneuverTypeSchema,
  // Déjà en français (requête Valhalla avec `language: "fr-FR"`) — jamais
  // reformulé côté client, un futur changement de moteur de routage ne
  // devrait pas avoir à réimplémenter la génération de texte.
  instruction: z.string(),
  streetName: z.string().optional(),
  // Présent seulement sur la manœuvre d'entrée dans un rond-point (Valhalla
  // ne le porte pas sur la manœuvre de sortie qui suit) — le numéro de
  // sortie à compter, pas un simple indicateur "c'est un rond-point".
  roundaboutExitNumber: z.number().int().positive().optional(),
  // Point absolu où la manœuvre se produit — pas un index dans `path`, pour
  // rester valable même si la fusion des legs (plusieurs arrêts) retire des
  // points de jonction en double.
  point: geoPointSchema,
});

export type ManeuverDto = z.infer<typeof maneuverSchema>;

// Limitation réglementaire sur une portion du tracé. Seuls les tronçons dont
// la limitation est connue du moteur de routage (donnée OpenStreetMap) sont
// présents : un trou entre deux segments signifie "limitation inconnue",
// jamais une valeur supposée d'après le type de route.
export const speedLimitSegmentSchema = z.object({
  // Index dans `path` : la limitation s'applique de path[startIndex] à
  // path[endIndex].
  startIndex: z.number().int().nonnegative(),
  endIndex: z.number().int().nonnegative(),
  speedLimitMps: z.number().positive(),
});

export type SpeedLimitSegmentDto = z.infer<typeof speedLimitSegmentSchema>;

export const routeGeometrySchema = z.object({
  distanceMeters: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  // Séquence ordonnée de points suivant les routes réelles (moteur de
  // routage), pas une ligne droite entre origine et destination.
  path: z.array(geoPointSchema).min(2),
  // Dans l'ordre de parcours, tous legs confondus. Peut être vide si
  // Valhalla n'en fournit aucune (cas limite, jamais observé en pratique) —
  // le guidage doit s'en accommoder sans planter.
  maneuvers: z.array(maneuverSchema),
  // Dans l'ordre du tracé, sans chevauchement. Vide si le moteur de routage
  // n'a pas pu les fournir : l'itinéraire reste utilisable sans elles.
  speedLimits: z.array(speedLimitSegmentSchema),
});

export type RouteGeometryDto = z.infer<typeof routeGeometrySchema>;
