import type { GeoPointDto, RouteGeometryDto } from '@roadtalk/contracts';
import { routeGeometrySchema } from '@roadtalk/contracts';

import { request } from '../../lib/http';

export async function computeRoute(
  accessToken: string,
  origin: GeoPointDto,
  destination: GeoPointDto,
): Promise<RouteGeometryDto> {
  const json = await request('POST', '/routing', {
    accessToken,
    body: { origin, destination },
  });

  return routeGeometrySchema.parse(json);
}
