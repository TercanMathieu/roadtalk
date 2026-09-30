import { Injectable } from '@nestjs/common';
import type { GeoPointDto, RouteGeometryDto } from '@roadtalk/contracts';

import { ValhallaRouter } from './valhalla.router';

@Injectable()
export class RoutingService {
  constructor(private readonly router: ValhallaRouter) {}

  async computeRoute(origin: GeoPointDto, destination: GeoPointDto): Promise<RouteGeometryDto> {
    return this.router.computeRoute(origin, destination);
  }
}
