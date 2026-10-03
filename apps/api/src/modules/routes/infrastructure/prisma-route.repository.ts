import { Injectable } from '@nestjs/common';
import type { Route as RouteRow } from '@prisma/client';
import { geoPointSchema, routeSourceSchema } from '@roadtalk/contracts';
import {
  degrees,
  meters,
  type RouteId,
  seconds,
  timestampMs,
  toRouteId,
  toUserId,
  type UserId,
} from '@roadtalk/domain-shared';
import { z } from 'zod';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { RouteRepository } from '../application/route-repository.port';
import type { Route } from '../domain/route.entity';

const waypointsSchema = z.array(geoPointSchema);

// Le JSON/texte vient du disque (colonne JSONB/String) : donnée externe,
// jamais supposée conforme sans validation (conventions RoadTalk).
function parseWaypoints(value: unknown): Route['waypoints'] {
  return waypointsSchema
    .parse(value)
    .map((point) => ({ latitude: degrees(point.latitude), longitude: degrees(point.longitude) }));
}

function toRoute(row: RouteRow): Route {
  return {
    id: toRouteId(row.id),
    authorId: toUserId(row.authorId),
    name: row.name ?? undefined,
    waypoints: parseWaypoints(row.waypoints),
    routingOptions: { avoidHighways: row.avoidHighways, avoidTolls: row.avoidTolls },
    source: routeSourceSchema.parse(row.source),
    fixedStart: row.fixedStart,
    distanceMeters: row.distanceMeters !== null ? meters(row.distanceMeters) : undefined,
    durationSeconds: row.durationSeconds !== null ? seconds(row.durationSeconds) : undefined,
    elevationGainMeters: row.elevationGainMeters !== null ? meters(row.elevationGainMeters) : undefined,
    isFavorite: row.isFavorite,
    createdAt: timestampMs(row.createdAt.getTime()),
  };
}

@Injectable()
export class PrismaRouteRepository implements RouteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(route: Route): Promise<void> {
    await this.prisma.route.create({
      data: {
        id: route.id,
        authorId: route.authorId,
        name: route.name ?? null,
        waypoints: route.waypoints.map((point) => ({ latitude: point.latitude, longitude: point.longitude })),
        avoidHighways: route.routingOptions.avoidHighways,
        avoidTolls: route.routingOptions.avoidTolls,
        source: route.source,
        fixedStart: route.fixedStart,
        distanceMeters: route.distanceMeters ?? null,
        durationSeconds: route.durationSeconds ?? null,
        elevationGainMeters: route.elevationGainMeters ?? null,
        isFavorite: route.isFavorite,
      },
    });
  }

  async findAllByAuthor(authorId: UserId): Promise<readonly Route[]> {
    const rows = await this.prisma.route.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map(toRoute);
  }

  async findByIdForAuthor(id: RouteId, authorId: UserId): Promise<Route | undefined> {
    // authorId dans le WHERE, pas vérifié après coup : empêche de lire
    // l'itinéraire d'un autre utilisateur en devinant son UUID (IDOR).
    const row = await this.prisma.route.findFirst({ where: { id, authorId } });
    return row === null ? undefined : toRoute(row);
  }

  async deleteByIdForAuthor(id: RouteId, authorId: UserId): Promise<boolean> {
    const { count } = await this.prisma.route.deleteMany({ where: { id, authorId } });
    return count > 0;
  }

  async renameByIdForAuthor(id: RouteId, authorId: UserId, name: string): Promise<boolean> {
    const { count } = await this.prisma.route.updateMany({ where: { id, authorId }, data: { name } });
    return count > 0;
  }

  async setFavoriteByIdForAuthor(id: RouteId, authorId: UserId, isFavorite: boolean): Promise<boolean> {
    const { count } = await this.prisma.route.updateMany({ where: { id, authorId }, data: { isFavorite } });
    return count > 0;
  }
}
