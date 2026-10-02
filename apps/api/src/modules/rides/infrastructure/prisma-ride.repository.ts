import { Injectable } from '@nestjs/common';
import type { Ride as RideRow } from '@prisma/client';
import { trackPointSchema } from '@roadtalk/contracts';
import {
  degrees,
  meters,
  metersPerSecond,
  type RideId,
  seconds,
  timestampMs,
  type UserId,
} from '@roadtalk/domain-shared';
import { z } from 'zod';

import { PrismaService } from '../../../infrastructure/database/prisma.service';
import type { RideListEntry, RideRecord, RideRepository } from '../application/ride-repository.port';
import type { CompletedRide } from '../domain/ride.entity';
import type { TrackPoint } from '../domain/track-point';

const trackSchema = z.array(trackPointSchema);

function toTrackPointJson(point: TrackPoint): z.infer<typeof trackPointSchema> {
  return {
    latitude: point.position.latitude,
    longitude: point.position.longitude,
    recordedAt: point.recordedAt,
    accuracyMeters: point.accuracyMeters,
    // exactOptionalPropertyTypes : n'inclure la clé que si elle est fournie,
    // jamais une valeur explicite `undefined` (voir conventions RoadTalk).
    ...(point.speedMps !== undefined ? { speedMps: point.speedMps } : {}),
    ...(point.altitudeMeters !== undefined ? { altitudeMeters: point.altitudeMeters } : {}),
  };
}

// Le JSON vient du disque (colonne JSONB) : donnée externe, jamais supposée
// conforme sans validation (conventions RoadTalk) — même si c'est cette même
// API qui l'a écrit, un schéma a pu changer entre-temps.
function parseTrack(value: unknown): readonly TrackPoint[] {
  return trackSchema.parse(value).map(
    (point): TrackPoint => ({
      position: { latitude: degrees(point.latitude), longitude: degrees(point.longitude) },
      recordedAt: timestampMs(point.recordedAt),
      accuracyMeters: meters(point.accuracyMeters),
      speedMps: point.speedMps !== undefined ? metersPerSecond(point.speedMps) : undefined,
      altitudeMeters: point.altitudeMeters !== undefined ? meters(point.altitudeMeters) : undefined,
    }),
  );
}

// routeId/participantIds ne sont pas persistés : aucune route n'est encore
// sauvegardée en V1 (routeId toujours absent) et participantIds vaut
// systématiquement [ownerId] (voir le commentaire du domaine à ce sujet) —
// les stocker serait une redondance jamais lue autrement que par ces mêmes
// constantes.
function toCompletedRide(row: RideRow): CompletedRide {
  return {
    id: row.id as RideId,
    ownerId: row.ownerId as UserId,
    routeId: undefined,
    participantIds: [row.ownerId as UserId],
    status: 'completed',
    startedAt: timestampMs(row.startedAt.getTime()),
    endedAt: timestampMs(row.endedAt.getTime()),
    summary: {
      distanceMeters: meters(row.distanceMeters),
      durationSeconds: seconds(row.durationSeconds),
      averageSpeedMps: metersPerSecond(row.averageSpeedMps),
      maxSpeedMps: metersPerSecond(row.maxSpeedMps),
      elevationGainMeters: meters(row.elevationGainMeters),
    },
  };
}

@Injectable()
export class PrismaRideRepository implements RideRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(record: RideRecord): Promise<void> {
    const { ride, name, track } = record;
    await this.prisma.ride.create({
      data: {
        id: ride.id,
        ownerId: ride.ownerId,
        name,
        startedAt: new Date(ride.startedAt),
        endedAt: new Date(ride.endedAt),
        distanceMeters: ride.summary.distanceMeters,
        durationSeconds: ride.summary.durationSeconds,
        averageSpeedMps: ride.summary.averageSpeedMps,
        maxSpeedMps: ride.summary.maxSpeedMps,
        elevationGainMeters: ride.summary.elevationGainMeters,
        track: track.map(toTrackPointJson),
      },
    });
  }

  async findAllByOwner(ownerId: UserId): Promise<readonly RideListEntry[]> {
    const rows = await this.prisma.ride.findMany({
      where: { ownerId },
      orderBy: { startedAt: 'desc' },
    });

    return rows.map((row) => ({ ride: toCompletedRide(row), name: row.name, isFavorite: row.isFavorite }));
  }

  async findByIdForOwner(id: RideId, ownerId: UserId): Promise<RideRecord | undefined> {
    // ownerId dans le WHERE, pas vérifié après coup : empêche de lire la
    // balade d'un autre utilisateur en devinant son UUID (IDOR), même si le
    // code est modifié plus tard sans y repenser.
    const row = await this.prisma.ride.findFirst({ where: { id, ownerId } });
    if (row === null) {
      return undefined;
    }

    return { ride: toCompletedRide(row), name: row.name, isFavorite: row.isFavorite, track: parseTrack(row.track) };
  }

  async deleteByIdForOwner(id: RideId, ownerId: UserId): Promise<boolean> {
    const { count } = await this.prisma.ride.deleteMany({ where: { id, ownerId } });
    return count > 0;
  }

  async setFavoriteByIdForOwner(id: RideId, ownerId: UserId, isFavorite: boolean): Promise<boolean> {
    const { count } = await this.prisma.ride.updateMany({ where: { id, ownerId }, data: { isFavorite } });
    return count > 0;
  }

  async renameByIdForOwner(id: RideId, ownerId: UserId, name: string): Promise<boolean> {
    const { count } = await this.prisma.ride.updateMany({ where: { id, ownerId }, data: { name } });
    return count > 0;
  }
}
