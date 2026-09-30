import type { GeoPointDto, RouteGeometryDto } from '@roadtalk/contracts';
import { routeGeometrySchema } from '@roadtalk/contracts';

import { request } from '../../lib/http';

export async function computeRoute(
  accessToken: string,
  waypoints: readonly GeoPointDto[],
  avoidHighways?: boolean,
): Promise<RouteGeometryDto> {
  const json = await request('POST', '/routing', {
    accessToken,
    // `exactOptionalPropertyTypes` : la clé n'est incluse que si elle est
    // réellement demandée, jamais envoyée à `false` explicitement (le
    // contrat traite l'absence et `false` de façon équivalente côté serveur,
    // mais absente correspond mieux à "non précisé").
    body: avoidHighways === true ? { waypoints, avoidHighways } : { waypoints },
  });

  return routeGeometrySchema.parse(json);
}
