import { Inject, Injectable } from '@nestjs/common';
import {
  createRouteId,
  type GeoPoint,
  type Meters,
  ok,
  type Result,
  type RouteId,
  type Seconds,
  timestampMs,
  type UserId,
} from '@roadtalk/domain-shared';

import {
  createRoute,
  type Route,
  type RouteValidationError,
  type RoutingOptions,
  withComputedMetrics,
} from '../domain/route.entity';
import { ROUTE_REPOSITORY, type RouteRepository } from './route-repository.port';

export interface SaveRouteInput {
  readonly authorId: UserId;
  readonly name: string | undefined;
  readonly waypoints: readonly GeoPoint[];
  readonly routingOptions: RoutingOptions;
  readonly distanceMeters: Meters | undefined;
  readonly durationSeconds: Seconds | undefined;
}

// Orchestre le domaine (ADR-001) : createRoute applique les mêmes
// invariants (au moins 2 points, coordonnées valides) qu'un futur flux F5
// construit directement en mobile. 'planned' uniquement ici — l'import GPX
// (F6, RouteSource 'gpx_import') n'est pas construit.
@Injectable()
export class RoutesService {
  constructor(@Inject(ROUTE_REPOSITORY) private readonly routes: RouteRepository) {}

  async save(input: SaveRouteInput): Promise<Result<Route, RouteValidationError>> {
    const created = createRoute({
      id: createRouteId(),
      authorId: input.authorId,
      ...(input.name !== undefined ? { name: input.name } : {}),
      waypoints: input.waypoints,
      routingOptions: input.routingOptions,
      source: 'planned',
      createdAt: timestampMs(Date.now()),
    });
    if (!created.ok) {
      return created;
    }

    const route =
      input.distanceMeters !== undefined && input.durationSeconds !== undefined
        ? withComputedMetrics(created.value, {
            distanceMeters: input.distanceMeters,
            durationSeconds: input.durationSeconds,
          })
        : created.value;

    await this.routes.save(route);
    return ok(route);
  }

  async listForAuthor(authorId: UserId): Promise<readonly Route[]> {
    return this.routes.findAllByAuthor(authorId);
  }

  async getForAuthor(id: RouteId, authorId: UserId): Promise<Route | undefined> {
    return this.routes.findByIdForAuthor(id, authorId);
  }

  async deleteForAuthor(id: RouteId, authorId: UserId): Promise<boolean> {
    return this.routes.deleteByIdForAuthor(id, authorId);
  }

  async renameForAuthor(id: RouteId, authorId: UserId, name: string): Promise<boolean> {
    return this.routes.renameByIdForAuthor(id, authorId, name);
  }

  async setFavoriteForAuthor(id: RouteId, authorId: UserId, isFavorite: boolean): Promise<boolean> {
    return this.routes.setFavoriteByIdForAuthor(id, authorId, isFavorite);
  }
}
