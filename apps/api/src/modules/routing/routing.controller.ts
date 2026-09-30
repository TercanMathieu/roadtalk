import { Body, Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  type RouteGeometryDto,
  routeGeometrySchema,
  type RoutingQueryDto,
  routingQuerySchema,
} from '@roadtalk/contracts';

import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ZodResponseInterceptor } from '../../infrastructure/http/zod-response.interceptor';
import { ZodValidationPipe } from '../../infrastructure/http/zod-validation.pipe';
import { RoutingService } from './routing.service';

// POST et non GET : un itinéraire complet (une séquence de points, pas deux
// coordonnées) dépasse ce qui est raisonnable dans une query string. Protégée
// pour la même raison que /search — éviter de servir de relais gratuit vers
// Valhalla.
@Controller('routing')
@UseGuards(JwtAuthGuard)
export class RoutingController {
  constructor(private readonly routingService: RoutingService) {}

  @Post()
  @UseInterceptors(new ZodResponseInterceptor(routeGeometrySchema))
  async computeRoute(
    @Body(new ZodValidationPipe(routingQuerySchema)) query: RoutingQueryDto,
  ): Promise<RouteGeometryDto> {
    return this.routingService.computeRoute(query.waypoints, query.avoidHighways);
  }
}
