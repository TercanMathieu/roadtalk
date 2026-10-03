import { degrees, meters, metersPerSecond, timestampMs } from '@roadtalk/domain-shared';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { toEpochMs } from '../map/epoch';
import { publishBackgroundPosition } from './background-position';
import { appendToJournal } from './ride-journal';
import type { TrackPoint } from './track-point';

// Enregistrement du tracé quand l'app n'est plus à l'écran (écran verrouillé,
// autre app au premier plan). Le flux de position utilisé pendant le guidage
// vient du moteur de MapLibre, qui se met en pause en arrière-plan : seule
// une tâche de localisation du système continue à livrer des points.
//
// Elle écrit directement dans le journal sur le disque (ride-journal.ts), sans
// passer par l'interface — elle tourne aussi quand celle-ci n'existe plus.
const TASK_NAME = 'roadtalk-ride-recording';

// Un point tous les 10 m : assez fin pour un tracé de moto, sans réveiller le
// GPS plus que nécessaire (C1).
const DISTANCE_INTERVAL_METERS = 10;

function toTrackPoint(location: Location.LocationObject): TrackPoint {
  const { coords } = location;
  return {
    position: { latitude: degrees(coords.latitude), longitude: degrees(coords.longitude) },
    recordedAt: timestampMs(toEpochMs(location.timestamp)),
    // Valeurs absentes ou invalides (le GPS donne -1 pour "inconnu") : pas de
    // valeur plutôt qu'un chiffre trompeur — jamais une vitesse recalculée.
    speedMps: coords.speed !== null && coords.speed >= 0 ? metersPerSecond(coords.speed) : undefined,
    altitudeMeters: coords.altitude !== null ? meters(coords.altitude) : undefined,
    accuracyMeters: meters(coords.accuracy ?? 0),
  };
}

// À définir au chargement de l'app, hors de tout composant : le système peut
// relancer le code JavaScript sans interface pour livrer des points.
// Le gestionnaire doit renvoyer une promesse : l'écriture, elle, est synchrone.
TaskManager.defineTask<{ locations?: Location.LocationObject[] }>(TASK_NAME, ({ data, error }) => {
  if (error === null && data.locations !== undefined) {
    const points = data.locations.map(toTrackPoint);
    appendToJournal(points);
    // Le guidage (progression, voix, recalcul) se nourrit aussi de ces
    // points : le flux de la carte, lui, est coupé en arrière-plan.
    const last = points[points.length - 1];
    if (last !== undefined) {
      publishBackgroundPosition({
        latitude: last.position.latitude,
        longitude: last.position.longitude,
        speedMps: last.speedMps,
        recordedAt: last.recordedAt,
      });
    }
  }
  return Promise.resolve();
});

// Démarre l'enregistrement en arrière-plan. Renvoie false si la permission
// « toujours » est refusée ou si le démarrage échoue : l'appelant continue
// alors avec le seul enregistrement au premier plan.
export async function startBackgroundRecording(): Promise<boolean> {
  try {
    const permission = await Location.requestBackgroundPermissionsAsync();
    if (!permission.granted) {
      return false;
    }

    await Location.startLocationUpdatesAsync(TASK_NAME, {
      accuracy: Location.Accuracy.High,
      distanceInterval: DISTANCE_INTERVAL_METERS,
      activityType: Location.ActivityType.AutomotiveNavigation,
      // iOS suspend les mises à jour quand la moto est à l'arrêt, ce qui
      // économise la batterie aux pauses ; elles reprennent au départ.
      pausesUpdatesAutomatically: true,
      showsBackgroundLocationIndicator: true,
      // Android exige une notification pour continuer en arrière-plan.
      foregroundService: {
        notificationTitle: 'RoadTalk enregistre ta balade',
        notificationBody: 'Le tracé est enregistré sur ton téléphone.',
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function stopBackgroundRecording(): Promise<void> {
  try {
    if (await Location.hasStartedLocationUpdatesAsync(TASK_NAME)) {
      await Location.stopLocationUpdatesAsync(TASK_NAME);
    }
  } catch {
    // Rien à arrêter, ou déjà arrêté.
  }
}
