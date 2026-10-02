import type { TrackPointDto } from '@roadtalk/contracts';
import { degrees, meters, metersPerSecond, timestampMs } from '@roadtalk/domain-shared';

import type { TrackPoint } from '../ride-summary/track-point';

// Même conversion que côté API (prisma-ride.repository.ts) : le DTO envoyé
// sur le fil est à plat (nombres bruts), le type de domaine mobile
// (ride-summary/track-point.ts, réutilisé par l'export GPX) porte les types
// nominaux.
export function toTrackPoints(points: readonly TrackPointDto[]): readonly TrackPoint[] {
  return points.map((point) => ({
    position: { latitude: degrees(point.latitude), longitude: degrees(point.longitude) },
    recordedAt: timestampMs(point.recordedAt),
    accuracyMeters: meters(point.accuracyMeters),
    speedMps: point.speedMps !== undefined ? metersPerSecond(point.speedMps) : undefined,
    altitudeMeters: point.altitudeMeters !== undefined ? meters(point.altitudeMeters) : undefined,
  }));
}
