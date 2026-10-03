import type {
  AddressSuggestionDto,
  GenerateAiRouteRequestDto,
  GeoPointDto,
} from '@roadtalk/contracts';
import { degrees, distanceBetweenMeters } from '@roadtalk/domain-shared';

// Vérifications géographiques d'une proposition du modèle, avant et après le
// calcul du trajet. Fonctions pures : le modèle peut se tromper de lieu ou de
// distance, c'est ici qu'on l'attrape.

// Vitesse moyenne d'une balade sur routes directes (~72 km/h), la plus rapide
// de celles annoncées au modèle : sert seulement à borner la portée des
// points proposés, jamais à afficher une durée — celle-ci vient du moteur de
// routage.
const FASTEST_PLANNING_SPEED_MPS = 20;

export function distanceMeters(from: GeoPointDto, to: GeoPointDto): number {
  return distanceBetweenMeters(
    { latitude: degrees(from.latitude), longitude: degrees(from.longitude) },
    { latitude: degrees(to.latitude), longitude: degrees(to.longitude) },
  );
}

// Distance à vol d'oiseau qu'on peut au plus parcourir dans la durée demandée.
export function maxTravelMeters(durationMinutes: number): number {
  return FASTEST_PLANNING_SPEED_MPS * durationMinutes * 60;
}

// Point où l'itinéraire se termine, quand il est connu d'avance : le départ
// pour une boucle, l'arrivée imposée sinon. `undefined` quand c'est le
// modèle qui choisit l'arrivée.
export function knownEnd(request: GenerateAiRouteRequestDto): GeoPointDto | undefined {
  return request.tripType === 'loop' ? request.origin : request.destination;
}

// Point autour duquel le géocodeur privilégie ses résultats : le milieu du
// trajet quand l'arrivée est imposée — sinon un lieu proche de l'arrivée
// perdrait face à un homonyme proche du départ. Moyenne simple des
// coordonnées : suffisant pour un biais de classement à l'échelle d'un pays.
export function searchBiasPoint(origin: GeoPointDto, end: GeoPointDto | undefined): GeoPointDto {
  if (end === undefined) {
    return origin;
  }
  return {
    latitude: (origin.latitude + end.latitude) / 2,
    longitude: (origin.longitude + end.longitude) / 2,
  };
}

// Un lieu est à portée si le détour départ → lieu → arrivée tient dans la
// distance parcourable — une ellipse autour des deux points. Pour une boucle
// (arrivée = départ), cela revient à s'éloigner d'au plus la moitié. Le but
// est d'écarter un homonyme à l'autre bout du pays, pas de calibrer la
// balade.
function isWithinReach(
  point: GeoPointDto,
  origin: GeoPointDto,
  end: GeoPointDto | undefined,
  travelMeters: number,
): boolean {
  const outbound = distanceMeters(origin, point);
  return end === undefined
    ? outbound <= travelMeters
    : outbound + distanceMeters(point, end) <= travelMeters;
}

// En dessous de cet écart, un lieu n'ajoute rien au trajet : souvent le même
// lieu proposé deux fois sous deux noms, ou un lieu confondu avec le départ
// ou l'arrivée.
const MIN_SPACING_METERS = 1_000;

// Premier résultat du géocodeur qui soit à portée et distinct du départ, de
// l'arrivée et des points déjà retenus. Les résultats arrivent déjà classés
// par pertinence.
export function pickWaypointCandidate(
  candidates: readonly AddressSuggestionDto[],
  origin: GeoPointDto,
  end: GeoPointDto | undefined,
  travelMeters: number,
  kept: readonly GeoPointDto[],
): AddressSuggestionDto | undefined {
  const occupied = [origin, ...(end !== undefined ? [end] : []), ...kept];
  return candidates.find(
    (candidate) =>
      isWithinReach(candidate, origin, end, travelMeters) &&
      occupied.every((point) => distanceMeters(point, candidate) >= MIN_SPACING_METERS),
  );
}

// Une boucle par un seul lieu n'est qu'un aller-retour sur la même route.
export function minimumWaypoints(tripType: GenerateAiRouteRequestDto['tripType']): number {
  return tripType === 'loop' ? 2 : 1;
}

// Écart toléré entre la durée calculée et la durée demandée.
const MIN_DURATION_RATIO = 0.6;
const MAX_DURATION_RATIO = 1.5;

export type DurationVerdict = 'ok' | 'too-short' | 'too-long';

export function durationVerdict(actualSeconds: number, targetMinutes: number): DurationVerdict {
  const ratio = actualSeconds / (targetMinutes * 60);
  if (ratio < MIN_DURATION_RATIO) {
    return 'too-short';
  }
  if (ratio > MAX_DURATION_RATIO) {
    return 'too-long';
  }
  return 'ok';
}

// Écart relatif à la cible, symétrique : une balade deux fois trop longue est
// aussi loin du compte qu'une balade deux fois trop courte.
export function durationGap(actualSeconds: number, targetMinutes: number): number {
  return Math.abs(Math.log(actualSeconds / (targetMinutes * 60)));
}
