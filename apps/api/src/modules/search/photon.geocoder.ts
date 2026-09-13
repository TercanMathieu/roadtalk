import { Injectable, Logger } from '@nestjs/common';
import { type AddressSuggestionDto, ErrorCode } from '@roadtalk/contracts';
import { z } from 'zod';

import { env } from '../../infrastructure/config/env';
import { AppException } from '../../infrastructure/errors/app-exception';

// Photon renvoie du GeoJSON dont presque tous les champs de `properties` sont
// facultatifs et varient d'un résultat à l'autre (un numéro de rue a `street`,
// une ville n'a que `name`). Donnée externe non fiable : tout passe par Zod,
// et un résultat mal formé est ignoré plutôt que de faire échouer la requête.
const photonFeatureSchema = z.object({
  geometry: z.object({
    coordinates: z.tuple([z.number(), z.number()]),
  }),
  properties: z.object({
    name: z.string().optional(),
    housenumber: z.string().optional(),
    street: z.string().optional(),
    postcode: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
  }),
});

const photonResponseSchema = z.object({
  features: z.array(z.unknown()),
});

type PhotonProperties = z.infer<typeof photonFeatureSchema>['properties'];

// La position de l'utilisateur n'est transmise au géocodeur qu'arrondie :
// 2 décimales ≈ 1 km, largement suffisant pour départager des villes distantes
// de plusieurs dizaines de kilomètres, et nettement moins traçable qu'une
// position GPS exacte envoyée à un tiers à chaque frappe (C4).
const BIAS_PRECISION_DECIMALS = 2;

function roundCoordinate(value: number): number {
  const factor = 10 ** BIAS_PRECISION_DECIMALS;

  return Math.round(value * factor) / factor;
}

// Point autour duquel privilégier les résultats — la position de l'utilisateur.
export interface SearchOrigin {
  readonly latitude: number;
  readonly longitude: number;
}

// Ligne principale : le plus spécifique dont on dispose.
function buildLabel(properties: PhotonProperties): string | undefined {
  const streetLine = [properties.housenumber, properties.street].filter(Boolean).join(' ');

  return properties.name ?? (streetLine.length > 0 ? streetLine : undefined) ?? properties.city;
}

// Ligne secondaire : situe le résultat, sans répéter la ligne principale.
function buildContext(properties: PhotonProperties, label: string): string | null {
  const parts = [properties.postcode, properties.city, properties.country]
    .filter((part): part is string => part !== undefined && part.length > 0)
    .filter((part) => part !== label);

  return parts.length > 0 ? parts.join(', ') : null;
}

@Injectable()
export class PhotonGeocoder {
  private readonly logger = new Logger(PhotonGeocoder.name);

  async searchAddresses(
    query: string,
    limit: number,
    origin?: SearchOrigin,
  ): Promise<AddressSuggestionDto[]> {
    const url = new URL('/api', env.PHOTON_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('lang', 'fr');

    if (origin !== undefined) {
      // Photon pondère ici importance du lieu ET distance à ce point : depuis
      // Lyon, « paris » renvoie toujours la capitale avant le lieu-dit du même
      // nom situé à 9 km. Ne surtout pas retrier les résultats par distance
      // derrière, ce compromis serait détruit. `location_bias_scale` reste au
      // défaut : mesuré sans effet utile en dessous de 1, et à 1 le biais est
      // purement désactivé.
      url.searchParams.set('lat', String(roundCoordinate(origin.latitude)));
      url.searchParams.set('lon', String(roundCoordinate(origin.longitude)));
    }

    const payload = await this.fetchPayload(url);

    return payload.features.flatMap((feature) => {
      const parsed = photonFeatureSchema.safeParse(feature);
      if (!parsed.success) {
        return [];
      }

      const label = buildLabel(parsed.data.properties);
      if (label === undefined) {
        return [];
      }

      const [longitude, latitude] = parsed.data.geometry.coordinates;

      return [
        {
          label,
          context: buildContext(parsed.data.properties, label),
          latitude,
          longitude,
        },
      ];
    });
  }

  private async fetchPayload(url: URL): Promise<z.infer<typeof photonResponseSchema>> {
    let response: Response;
    try {
      response = await fetch(url);
    } catch (error) {
      // Jamais la requête brute dans les logs : elle peut contenir une adresse
      // que l'utilisateur a saisie (C4).
      this.logger.error('Géocodeur injoignable', error);
      throw new AppException(ErrorCode.SEARCH_PROVIDER_UNAVAILABLE);
    }

    if (!response.ok) {
      this.logger.error(`Géocodeur en erreur (HTTP ${String(response.status)})`);
      throw new AppException(ErrorCode.SEARCH_PROVIDER_UNAVAILABLE);
    }

    const parsed = photonResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      this.logger.error('Réponse du géocodeur non conforme');
      throw new AppException(ErrorCode.SEARCH_PROVIDER_UNAVAILABLE);
    }

    return parsed.data;
  }
}
