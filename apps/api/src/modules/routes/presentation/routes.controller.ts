import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ErrorCode,
  type RenameRouteRequestDto,
  renameRouteRequestSchema,
  type RouteDto,
  routeListSchema,
  routeSchema,
  type SaveRouteRequestDto,
  saveRouteRequestSchema,
} from '@roadtalk/contracts';
import { degrees, meters, seconds, toRouteId, type UserId } from '@roadtalk/domain-shared';

import { CurrentUserId } from '../../../infrastructure/auth/current-user.decorator';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { AppException } from '../../../infrastructure/errors/app-exception';
import { ZodResponseInterceptor } from '../../../infrastructure/http/zod-response.interceptor';
import { ZodValidationPipe } from '../../../infrastructure/http/zod-validation.pipe';
import { RoutesService } from '../application/routes.service';
import type { Route } from '../domain/route.entity';

function toRouteDto(route: Route): RouteDto {
  return {
    id: route.id,
    authorId: route.authorId,
    ...(route.name !== undefined ? { name: route.name } : {}),
    waypoints: route.waypoints.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
    routingOptions: route.routingOptions,
    source: route.source,
    ...(route.distanceMeters !== undefined ? { distanceMeters: route.distanceMeters } : {}),
    ...(route.durationSeconds !== undefined ? { durationSeconds: route.durationSeconds } : {}),
    ...(route.elevationGainMeters !== undefined ? { elevationGainMeters: route.elevationGainMeters } : {}),
    createdAt: route.createdAt,
  };
}

// Toutes les routes portent sur "les itinéraires de l'appelant", même
// logique que RidesController/UsersController.
@Controller('routes')
@UseGuards(JwtAuthGuard)
export class RoutesController {
  constructor(private readonly routes: RoutesService) {}

  @Post()
  @UseInterceptors(new ZodResponseInterceptor(routeSchema))
  async save(
    @CurrentUserId() authorId: UserId,
    @Body(new ZodValidationPipe(saveRouteRequestSchema)) body: SaveRouteRequestDto,
  ): Promise<RouteDto> {
    const result = await this.routes.save({
      authorId,
      name: body.name,
      waypoints: body.waypoints.map((point) => ({
        latitude: degrees(point.latitude),
        longitude: degrees(point.longitude),
      })),
      routingOptions: body.routingOptions,
      distanceMeters: body.distanceMeters !== undefined ? meters(body.distanceMeters) : undefined,
      durationSeconds: body.durationSeconds !== undefined ? seconds(body.durationSeconds) : undefined,
    });

    if (!result.ok) {
      // N'arrive en pratique que si le mobile envoie un waypoint hors bornes
      // ou moins de 2 points — déjà filtré par saveRouteRequestSchema
      // (geoPointSchema, .min(2)), donc ce chemin n'est accessible qu'en cas
      // d'incohérence entre le contrat Zod et les règles du domaine.
      throw new AppException(ErrorCode.VALIDATION_ERROR, 'Itinéraire invalide');
    }

    return toRouteDto(result.value);
  }

  @Get()
  @UseInterceptors(new ZodResponseInterceptor(routeListSchema))
  async list(@CurrentUserId() authorId: UserId): Promise<readonly RouteDto[]> {
    const routes = await this.routes.listForAuthor(authorId);
    return routes.map(toRouteDto);
  }

  @Get(':id')
  @UseInterceptors(new ZodResponseInterceptor(routeSchema))
  async getById(@CurrentUserId() authorId: UserId, @Param('id', ParseUUIDPipe) id: string): Promise<RouteDto> {
    const route = await this.routes.getForAuthor(toRouteId(id), authorId);
    if (route === undefined) {
      throw new AppException(ErrorCode.SAVED_ROUTE_NOT_FOUND, 'Itinéraire introuvable');
    }
    return toRouteDto(route);
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteById(@CurrentUserId() authorId: UserId, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const deleted = await this.routes.deleteForAuthor(toRouteId(id), authorId);
    if (!deleted) {
      throw new AppException(ErrorCode.SAVED_ROUTE_NOT_FOUND, 'Itinéraire introuvable');
    }
  }

  @Patch(':id/name')
  @HttpCode(204)
  async rename(
    @CurrentUserId() authorId: UserId,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(renameRouteRequestSchema)) body: RenameRouteRequestDto,
  ): Promise<void> {
    const updated = await this.routes.renameForAuthor(toRouteId(id), authorId, body.name);
    if (!updated) {
      throw new AppException(ErrorCode.SAVED_ROUTE_NOT_FOUND, 'Itinéraire introuvable');
    }
  }
}
