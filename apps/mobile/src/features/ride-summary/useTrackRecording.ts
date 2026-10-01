import { degrees, type Meters, type MetersPerSecond, type TimestampMs } from '@roadtalk/domain-shared';
import { useEffect, useRef } from 'react';

import type { TrackPoint } from './track-point';

interface LivePoint {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracyMeters: Meters;
  readonly altitudeMeters: Meters | undefined;
  readonly speedMps: MetersPerSecond | undefined;
  readonly recordedAt: TimestampMs;
}

interface TrackRecording {
  // Efface le tracé accumulé — appelé au démarrage d'un nouveau guidage,
  // jamais pendant (sinon la balade en cours perdrait ses premiers points).
  readonly reset: () => void;
  // Lecture ponctuelle (à la sortie du guidage), pas un état React : ce
  // tracé peut contenir des milliers de points sur une longue balade,
  // le garder hors du state évite un re-rendu à chaque point GPS.
  readonly getPoints: () => readonly TrackPoint[];
}

// Accumule le tracé pendant le guidage à partir du flux de position déjà
// actif (useVehiclePosition) — aucune souscription GPS supplémentaire (C1).
export function useTrackRecording(point: LivePoint | undefined, isRecording: boolean): TrackRecording {
  const pointsRef = useRef<TrackPoint[]>([]);
  const lastRecordedAtRef = useRef<TimestampMs | undefined>(undefined);

  useEffect(() => {
    if (!isRecording || point === undefined) {
      return;
    }
    // Le flux de position ne livre pas forcément un nouveau point à chaque
    // rendu (ex. un rendu déclenché par autre chose) — ne pas dupliquer le
    // dernier point enregistré.
    if (lastRecordedAtRef.current === point.recordedAt) {
      return;
    }
    lastRecordedAtRef.current = point.recordedAt;

    pointsRef.current.push({
      position: { latitude: degrees(point.latitude), longitude: degrees(point.longitude) },
      recordedAt: point.recordedAt,
      speedMps: point.speedMps,
      altitudeMeters: point.altitudeMeters,
      accuracyMeters: point.accuracyMeters,
    });
  }, [point, isRecording]);

  return {
    reset: () => {
      pointsRef.current = [];
      lastRecordedAtRef.current = undefined;
    },
    getPoints: () => pointsRef.current,
  };
}
