import type { GeoPointDto, RouteGeometryDto } from '@roadtalk/contracts';
import { routeGeometrySchema } from '@roadtalk/contracts';

import { request } from '../../lib/http';

export async function computeRoute(
  accessToken: string,
  waypoints: readonly GeoPointDto[],
): Promise<RouteGeometryDto> {
  const json = await request('POST', '/routing', {
    accessToken,
    body: { waypoints },
  });

  return routeGeometrySchema.parse(json);
}
