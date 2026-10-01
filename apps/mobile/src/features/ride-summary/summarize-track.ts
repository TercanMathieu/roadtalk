import type { Meters, MetersPerSecond, Seconds } from '@roadtalk/domain-shared';
import { distanceBetweenMeters, meters, metersPerSecond, seconds } from '@roadtalk/domain-shared';

import type { TrackPoint } from './track-point';

/**
 * Au-delà, le fix est trop incertain pour contribuer à une distance : un point
 * à 100 m près peut "sauter" d'un bout de rue à l'autre et inventer des mètres
 * qui n'ont pas été parcourus. Seuil usuel pour du GNSS en milieu dégagé —
 * même valeur que côté API (rides/domain/summarize-track.ts).
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

// Même seuil que la fiabilité du cap ailleurs dans l'app
// (useVehiclePosition, MIN_SPEED_FOR_HEADING_MPS) : en dessous, le bruit
// Doppler domine, l'appareil est considéré à l'arrêt.
const STOPPED_SPEED_MPS = 1.39;

export interface RideSummary {
  readonly distanceMeters: Meters;
  readonly durationSeconds: Seconds;
  readonly averageSpeedMps: MetersPerSecond;
  readonly maxSpeedMps: MetersPerSecond;
  readonly elevationGainMeters: Meters;
  // Absent du RideSummary API (voir son commentaire : "pas au périmètre V1",
  // la notion d'arrêt y est volontairement laissée ouverte) — calcul propre
  // à cet écran, pas une divergence avec le résumé serveur.
  readonly stoppedSeconds: Seconds;
  // Part des points retenus pour le calcul (précision suffisante) — reflète
  // la qualité réelle du fix GPS pendant la balade, jamais une valeur
  // inventée comme "100%".
  readonly usableFixRatio: number;
}

const EMPTY_SUMMARY: RideSummary = {
  distanceMeters: meters(0),
  durationSeconds: seconds(0),
  averageSpeedMps: metersPerSecond(0),
  maxSpeedMps: metersPerSecond(0),
  elevationGainMeters: meters(0),
  stoppedSeconds: seconds(0),
  usableFixRatio: 0,
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

// Durée passée avec une vitesse Doppler sous le seuil de bruit — jamais
// dérivée d'une distance, seulement de la vitesse mesurée au point précédent
// (règle physique du projet).
function stoppedSeconds(points: readonly TrackPoint[]): Seconds {
  let total = 0;
  let previous: TrackPoint | undefined;

  for (const point of points) {
    if (previous !== undefined) {
      const elapsedMs = point.recordedAt - previous.recordedAt;
      if (previous.speedMps !== undefined && previous.speedMps < STOPPED_SPEED_MPS && elapsedMs > 0) {
        total += elapsedMs / MS_PER_SECOND;
      }
    }
    previous = point;
  }

  return seconds(total);
}

/**
 * Résumé d'une balade à partir de son tracé, calculé côté client — une
 * balade peut se terminer hors réseau (C3), le résumé doit s'afficher sans
 * aller-retour serveur. Même algorithme que `summarizeTrack` côté API
 * (rides/domain/summarize-track.ts), porté ici plutôt que partagé : ce
 * module appartient au contexte Ride de l'API (ADR-001), pas à
 * domain-shared.
 *
 * Fonction totale : un tracé vide, ou entièrement composé de fixes imprécis,
 * rend un résumé à zéro plutôt qu'une erreur.
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
    stoppedSeconds: stoppedSeconds(usable),
    usableFixRatio: usable.length / points.length,
  };
}
