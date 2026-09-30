import type { Meters, MetersPerSecond, Seconds } from '@roadtalk/domain-shared';
import { distanceBetweenMeters, meters, metersPerSecond, seconds } from '@roadtalk/domain-shared';

import type { RideSummary } from './ride.entity';
import type { TrackPoint } from './track-point';

/**
 * Au-delà, le fix est trop incertain pour contribuer à une distance : un point
 * à 100 m près peut "sauter" d'un bout de rue à l'autre et inventer des mètres
 * qui n'ont pas été parcourus. Seuil usuel pour du GNSS en milieu dégagé.
 */
const MAX_USABLE_ACCURACY_METERS = 25;

/**
 * En dessous, on considère l'appareil immobile. Sans ce plancher, la dérive du
 * GPS à l'arrêt s'accumule : une moto garée une heure "parcourt" des centaines
 * de mètres. C'est le défaut le plus visible d'un compteur naïf.
 */
const MIN_SEGMENT_METERS = 3;

/**
 * Hystérésis sur l'altitude. Le GNSS donne l'altitude à ±15 m ; sommer toutes
 * les variations positives ferait "grimper" plusieurs centaines de mètres sur
 * un parcours parfaitement plat. On ne valide une montée qu'une fois ce gain
 * franchi depuis le dernier creux.
 */
const MIN_ELEVATION_GAIN_METERS = 5;

const EMPTY_SUMMARY: RideSummary = {
  distanceMeters: meters(0),
  durationSeconds: seconds(0),
  averageSpeedMps: metersPerSecond(0),
  maxSpeedMps: metersPerSecond(0),
  elevationGainMeters: meters(0),
};

const MS_PER_SECOND = 1000;

function isUsable(point: TrackPoint): boolean {
  return point.accuracyMeters <= MAX_USABLE_ACCURACY_METERS;
}

function totalDistanceMeters(points: readonly TrackPoint[]): Meters {
  let total = 0;
  let previous: TrackPoint | undefined;

  for (const point of points) {
    if (previous !== undefined) {
      const segment = distanceBetweenMeters(previous.position, point.position);
      // Le point de référence n'avance que lorsqu'un vrai déplacement est
      // constaté : sinon un sur-place prolongé serait découpé en une multitude
      // de micro-segments tous sous le seuil, et le trajet réel se perdrait.
      if (segment >= MIN_SEGMENT_METERS) {
        total += segment;
        previous = point;
      }
      continue;
    }
    previous = point;
  }

  return meters(total);
}

/** Maximum des vitesses mesurées. Jamais dérivé d'une distance (règle physique). */
function maxSpeedMps(points: readonly TrackPoint[]): MetersPerSecond {
  let max = 0;

  for (const point of points) {
    if (point.speedMps !== undefined && point.speedMps > max) {
      max = point.speedMps;
    }
  }

  return metersPerSecond(max);
}

function elevationGainMeters(points: readonly TrackPoint[]): Meters {
  let total = 0;
  let reference: number | undefined;

  for (const point of points) {
    const altitude = point.altitudeMeters;
    if (altitude === undefined) {
      continue;
    }

    if (reference === undefined) {
      reference = altitude;
      continue;
    }

    if (altitude < reference) {
      // Nouveau creux : c'est depuis lui que la prochaine montée se mesure.
      reference = altitude;
    } else if (altitude - reference >= MIN_ELEVATION_GAIN_METERS) {
      total += altitude - reference;
      reference = altitude;
    }
  }

  return meters(total);
}

function elapsedSeconds(points: readonly TrackPoint[]): Seconds {
  const first = points[0];
  const last = points[points.length - 1];

  if (first === undefined || last === undefined) {
    return seconds(0);
  }

  return seconds(Math.max(0, (last.recordedAt - first.recordedAt) / MS_PER_SECOND));
}

/**
 * Résumé d'une balade à partir de son tracé.
 *
 * Fonction totale : un tracé vide, ou entièrement composé de fixes imprécis,
 * rend un résumé à zéro plutôt qu'une erreur. Démarrer une balade sans jamais
 * accrocher le GPS est un déroulement possible, pas une anomalie.
 *
 * La vitesse moyenne est distance/durée — donc pauses comprises. Une moyenne
 * "en mouvement" est un autre indicateur, qui demanderait de définir ce qu'est
 * un arrêt ; ce n'est pas au périmètre V1.
 */
export function summarizeTrack(points: readonly TrackPoint[]): RideSummary {
  const usable = points.filter(isUsable);
  if (usable.length === 0) {
    return EMPTY_SUMMARY;
  }

  const distance = totalDistanceMeters(usable);
  const duration = elapsedSeconds(usable);

  return {
    distanceMeters: distance,
    durationSeconds: duration,
    averageSpeedMps: metersPerSecond(duration > 0 ? distance / duration : 0),
    maxSpeedMps: maxSpeedMps(usable),
    elevationGainMeters: elevationGainMeters(usable),
  };
}
