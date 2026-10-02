import { type RouteDto, routeListSchema, routeSchema } from '@roadtalk/contracts';

import { request } from '../../lib/http';

export interface SaveRouteParams {
  readonly name: string | undefined;
  readonly waypoints: readonly { readonly latitude: number; readonly longitude: number }[];
  readonly avoidHighways: boolean;
  readonly distanceMeters: number | undefined;
  readonly durationSeconds: number | undefined;
}

export async function saveRoute(accessToken: string, params: SaveRouteParams): Promise<RouteDto> {
  const json = await request('POST', '/routes', {
    accessToken,
    body: {
      ...(params.name !== undefined ? { name: params.name } : {}),
      waypoints: params.waypoints,
      // avoidTolls : aucun réglage pour ça dans l'app aujourd'hui (seul
      // avoidHighways existe) — false reflète l'état réel, pas une valeur
      // inventée.
      routingOptions: { avoidHighways: params.avoidHighways, avoidTolls: false },
      ...(params.distanceMeters !== undefined ? { distanceMeters: params.distanceMeters } : {}),
      ...(params.durationSeconds !== undefined ? { durationSeconds: params.durationSeconds } : {}),
    },
  });

  return routeSchema.parse(json);
}

export async function listRoutes(accessToken: string): Promise<readonly RouteDto[]> {
  const json = await request('GET', '/routes', { accessToken });
  return routeListSchema.parse(json);
}

export async function deleteRoute(accessToken: string, id: string): Promise<void> {
  await request('DELETE', `/routes/${id}`, { accessToken });
}
