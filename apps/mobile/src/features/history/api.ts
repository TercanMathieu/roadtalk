import {
  type RideDetailDto,
  rideDetailSchema,
  type RideListItemDto,
  rideListSchema,
} from '@roadtalk/contracts';

import { request } from '../../lib/http';
import type { TrackPoint } from '../ride-summary/track-point';

export interface SaveRideParams {
  readonly id: string;
  readonly name: string;
  readonly startedAt: number;
  readonly endedAt: number;
  readonly track: readonly TrackPoint[];
}

function toTrackPointDto(point: TrackPoint): Record<string, unknown> {
  return {
    latitude: point.position.latitude,
    longitude: point.position.longitude,
    recordedAt: point.recordedAt,
    accuracyMeters: point.accuracyMeters,
    // exactOptionalPropertyTypes côté domaine mobile : ne reconstruire la clé
    // que si elle est réellement fournie.
    ...(point.speedMps !== undefined ? { speedMps: point.speedMps } : {}),
    ...(point.altitudeMeters !== undefined ? { altitudeMeters: point.altitudeMeters } : {}),
  };
}

export async function saveRide(accessToken: string, params: SaveRideParams): Promise<RideDetailDto> {
  const json = await request('POST', '/rides', {
    accessToken,
    body: {
      id: params.id,
      name: params.name,
      startedAt: params.startedAt,
      endedAt: params.endedAt,
      track: params.track.map(toTrackPointDto),
    },
  });

  return rideDetailSchema.parse(json);
}

export async function listRides(accessToken: string): Promise<readonly RideListItemDto[]> {
  const json = await request('GET', '/rides', { accessToken });
  return rideListSchema.parse(json);
}

export async function getRide(accessToken: string, id: string): Promise<RideDetailDto> {
  const json = await request('GET', `/rides/${id}`, { accessToken });
  return rideDetailSchema.parse(json);
}

export async function deleteRide(accessToken: string, id: string): Promise<void> {
  await request('DELETE', `/rides/${id}`, { accessToken });
}

export async function setRideFavorite(accessToken: string, id: string, isFavorite: boolean): Promise<void> {
  await request('PATCH', `/rides/${id}/favorite`, { accessToken, body: { isFavorite } });
}

export async function renameRide(accessToken: string, id: string, name: string): Promise<void> {
  await request('PATCH', `/rides/${id}/name`, { accessToken, body: { name } });
}
