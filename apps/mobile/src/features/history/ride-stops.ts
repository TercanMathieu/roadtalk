import { distanceBetweenMeters, type GeoPoint, type Seconds, seconds, type TimestampMs } from '@roadtalk/domain-shared';

import type { TrackPoint } from '../ride-summary/track-point';

// Un arrêt = rester dans ce rayon pendant au moins cette durée. Le rayon
// absorbe le bruit GPS à l'arrêt et les petits déplacements à pied autour de
// la moto ; la durée écarte les feux rouges et les ralentissements.
const STOP_RADIUS_METERS = 50;
const MIN_STOP_DURATION_SECONDS = 120;
const MS_PER_SECOND = 1000;

export interface RideStop {
  readonly position: GeoPoint;
  readonly startedAt: TimestampMs;
  readonly duration: Seconds;
}

// Arrêts faits pendant une balade, retrouvés dans le tracé GPS — rien n'est
// enregistré à part au moment où ils se produisent. Le flux de position ne
// livre un point que tous les quelques mètres : une pause apparaît donc
// surtout comme un long intervalle entre deux points voisins, ce que cette
// détection par rayon + durée couvre sans dépendre de la vitesse mesurée.
//
// Le départ et l'arrivée ne comptent pas comme des arrêts : attendre avant
// de partir ou rester sur place une fois arrivé fait déjà partie des lignes
// "Départ" et "Arrivée" du récapitulatif.
export function detectRideStops(points: readonly TrackPoint[]): readonly RideStop[] {
  const stops: RideStop[] = [];
  let index = 0;

  while (index < points.length) {
    const anchor = points[index];
    if (anchor === undefined) {
      break;
    }

    let lastInRadius = index;
    for (let next = index + 1; next < points.length; next += 1) {
      const candidate = points[next];
      if (
        candidate === undefined ||
        distanceBetweenMeters(anchor.position, candidate.position) > STOP_RADIUS_METERS
      ) {
        break;
      }
      lastInRadius = next;
    }

    // Le point suivant (hors rayon) marque le moment du redépart : sans lui,
    // une pause entre deux points éloignés l'un de l'autre aurait une durée
    // nulle. Absent seulement quand le tracé se termine sur place.
    const departure = points[lastInRadius + 1];
    const endedAt = (departure ?? points[lastInRadius] ?? anchor).recordedAt;
    const durationSeconds = (endedAt - anchor.recordedAt) / MS_PER_SECOND;
    const isAtStart = index === 0;
    const isAtEnd = departure === undefined;

    if (durationSeconds >= MIN_STOP_DURATION_SECONDS && !isAtStart && !isAtEnd) {
      stops.push({ position: anchor.position, startedAt: anchor.recordedAt, duration: seconds(durationSeconds) });
    }

    index = lastInRadius + 1;
  }

  return stops;
}
