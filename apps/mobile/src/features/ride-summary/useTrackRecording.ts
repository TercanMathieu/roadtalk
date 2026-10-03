import { degrees, type Meters, type MetersPerSecond, type TimestampMs } from '@roadtalk/domain-shared';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { startBackgroundRecording, stopBackgroundRecording } from './background-recording';
import { appendToJournal, readJournal, startJournal } from './ride-journal';
import { createRideId } from './rideId';
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
  // Démarre l'enregistrement d'une nouvelle balade : efface le tracé en
  // mémoire, ouvre un journal sur le disque, et renvoie l'identifiant de la
  // balade. Appelé au démarrage d'un guidage, jamais pendant (sinon la balade
  // en cours perdrait ses premiers points).
  readonly start: () => string;
  // Termine l'enregistrement : arrête la tâche d'arrière-plan, complète le
  // journal sur le disque et renvoie le tracé complet. À appeler à la fin du
  // guidage ; le journal est alors à jour avant l'écran de résumé.
  readonly stop: () => readonly TrackPoint[];
  // Identifiant de la balade en cours ou tout juste terminée.
  readonly getRideId: () => string | undefined;
}

// Les points sont écrits sur le disque par paquets, pas un par un : à vitesse
// de route, le flux en livre plusieurs par seconde, et une écriture chacun
// serait du travail inutile (C1). Un arrêt brutal de l'app perd au plus un
// paquet — une dizaine de points, quelques secondes de trajet.
const JOURNAL_FLUSH_EVERY_POINTS = 10;

// Accumule le tracé pendant le guidage à partir du flux de position déjà
// actif (useVehiclePosition) — aucune souscription GPS supplémentaire (C1) —
// et le recopie dans un journal sur le disque : si l'app est tuée en route,
// la balade peut être retrouvée au démarrage suivant (voir ride-journal.ts).
export function useTrackRecording(point: LivePoint | undefined, isRecording: boolean): TrackRecording {
  const pointsRef = useRef<TrackPoint[]>([]);
  const pendingRef = useRef<TrackPoint[]>([]);
  const rideIdRef = useRef<string | undefined>(undefined);
  // Vrai quand la tâche d'arrière-plan est active : c'est alors elle qui écrit
  // le journal, l'interface ne le fait plus (sinon chaque point y serait deux
  // fois). Avant qu'elle ne démarre, et si la permission est refusée,
  // l'interface reste seule à l'alimenter.
  const isBackgroundActiveRef = useRef(false);
  const lastRecordedAtRef = useRef<TimestampMs | undefined>(undefined);

  const flush = (): void => {
    if (pendingRef.current.length === 0) {
      return;
    }
    if (!isBackgroundActiveRef.current) {
      appendToJournal(pendingRef.current);
    }
    pendingRef.current = [];
  };

  // Un passage en arrière-plan précède souvent un arrêt par le système : c'est
  // le dernier moment sûr pour écrire ce qui est en attente.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        flush();
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);

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

    const trackPoint: TrackPoint = {
      position: { latitude: degrees(point.latitude), longitude: degrees(point.longitude) },
      recordedAt: point.recordedAt,
      speedMps: point.speedMps,
      altitudeMeters: point.altitudeMeters,
      accuracyMeters: point.accuracyMeters,
    };
    pointsRef.current.push(trackPoint);
    pendingRef.current.push(trackPoint);
    if (pendingRef.current.length >= JOURNAL_FLUSH_EVERY_POINTS) {
      flush();
    }
  }, [point, isRecording]);

  return {
    start: () => {
      const rideId = createRideId();
      pointsRef.current = [];
      pendingRef.current = [];
      lastRecordedAtRef.current = undefined;
      rideIdRef.current = rideId;
      isBackgroundActiveRef.current = false;
      try {
        startJournal({ rideId, startedAt: Date.now() });
      } catch {
        // Pas de journal (disque plein…) : la balade s'enregistre quand même
        // en mémoire, sans protection contre un arrêt brutal.
      }
      startBackgroundRecording()
        .then((isActive) => {
          isBackgroundActiveRef.current = isActive;
        })
        .catch(() => undefined);
      return rideId;
    },
    stop: () => {
      stopBackgroundRecording().catch(() => undefined);
      isBackgroundActiveRef.current = false;
      flush();
      // Le journal fait foi : il contient aussi ce que la tâche d'arrière-plan
      // a enregistré pendant que l'interface ne recevait plus rien. La
      // mémoire ne sert que si le journal est illisible.
      const fromJournal = readJournal()?.points ?? [];
      return fromJournal.length >= pointsRef.current.length ? fromJournal : pointsRef.current;
    },
    getRideId: () => rideIdRef.current,
  };
}
