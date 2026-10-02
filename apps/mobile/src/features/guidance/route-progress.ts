import type { GeoPointDto, ManeuverDto, RouteGeometryDto, SpeedLimitSegmentDto } from '@roadtalk/contracts';
import {
  degrees,
  distanceBetweenMeters,
  type GeoPoint,
  type Meters,
  meters,
  type Seconds,
  seconds,
} from '@roadtalk/domain-shared';

// Au-delà de cette distance au tracé le plus proche, la position est
// considérée hors trajet plutôt que juste imprécise (bruit GPS habituel :
// quelques mètres à dizaines de mètres selon l'environnement urbain).
export const OFF_ROUTE_THRESHOLD_METERS = meters(80);

function toGeoPoint(point: GeoPointDto): GeoPoint {
  return { latitude: degrees(point.latitude), longitude: degrees(point.longitude) };
}

interface NearestPoint {
  readonly index: number;
  readonly distance: Meters;
}

// Point le plus proche par recherche exhaustive — pas une projection sur les
// segments du tracé. Un trajet réel a au plus quelques centaines de points
// (un point tous les ~10-30m), largement assez rapide pour tourner à chaque
// mise à jour GPS ; une projection point-segment serait plus précise mais
// inutile ici, l'écart reste sous la précision du GPS lui-même.
function findNearestPathPoint(path: readonly GeoPointDto[], position: GeoPointDto): NearestPoint {
  const positionPoint = toGeoPoint(position);
  let nearestIndex = 0;
  let nearestDistance = meters(Number.POSITIVE_INFINITY);

  for (let i = 0; i < path.length; i += 1) {
    const point = path[i];
    if (point === undefined) {
      continue;
    }

    const distance = distanceBetweenMeters(toGeoPoint(point), positionPoint);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = i;
    }
  }

  return { index: nearestIndex, distance: nearestDistance };
}

function buildCumulativeDistances(path: readonly GeoPointDto[]): readonly Meters[] {
  const cumulative: Meters[] = [meters(0)];
  let total = 0;

  for (let i = 1; i < path.length; i += 1) {
    const previous = path[i - 1];
    const current = path[i];
    if (previous === undefined || current === undefined) {
      break; // Ne devrait jamais arriver vu les bornes de la boucle.
    }

    total += distanceBetweenMeters(toGeoPoint(previous), toGeoPoint(current));
    cumulative.push(meters(total));
  }

  return cumulative;
}

interface ManeuverProgress {
  readonly maneuver: ManeuverDto;
  // Distance depuis le départ du tracé jusqu'au point du tracé le plus
  // proche de cette manœuvre — précalculée une fois par trajet, jamais
  // recalculée à chaque mise à jour de position.
  readonly cumulativeDistance: Meters;
}

// Précalcul dépendant du trajet seul (pas de la position live) : à
// reconstruire quand le trajet change, jamais à chaque point GPS — voir
// useRouteProgress, qui le mémorise par identité de `route`.
export interface RouteProgressModel {
  readonly path: readonly GeoPointDto[];
  readonly cumulativeDistances: readonly Meters[];
  readonly totalDistance: Meters;
  // Estimation Valhalla pour le trajet entier (vitesses réglementaires par
  // type de route, pas la vitesse réelle du pilote) — sert uniquement à
  // dériver une durée restante proportionnelle à la distance restante.
  readonly totalDuration: Seconds;
  readonly maneuverProgress: readonly ManeuverProgress[];
  readonly speedLimits: readonly SpeedLimitSegmentDto[];
}

export function buildRouteProgressModel(route: RouteGeometryDto): RouteProgressModel {
  const cumulativeDistances = buildCumulativeDistances(route.path);
  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1] ?? meters(0);

  const maneuverProgress = route.maneuvers.map((maneuver) => {
    const { index } = findNearestPathPoint(route.path, maneuver.point);
    return { maneuver, cumulativeDistance: cumulativeDistances[index] ?? meters(0) };
  });

  return {
    path: route.path,
    cumulativeDistances,
    totalDistance,
    totalDuration: seconds(route.durationSeconds),
    maneuverProgress,
    speedLimits: route.speedLimits,
  };
}

export interface ManeuverStep {
  readonly maneuver: ManeuverDto;
  // Distance du segment de route gouverné par cette manœuvre, jusqu'à la
  // suivante — 0 pour la dernière (l'arrivée n'a rien après elle).
  readonly segmentDistance: Meters;
}

// Récapitulatif complet du trajet (toutes les manœuvres, pas seulement la
// prochaine) — pour le panneau "étapes" déplié depuis le pied de guidage, pas
// pour l'affichage glanceable en roulant (voir ManeuverBanner).
export function getManeuverSteps(model: RouteProgressModel): readonly ManeuverStep[] {
  return model.maneuverProgress.map((entry, index) => {
    const next = model.maneuverProgress[index + 1];
    const segmentDistance =
      next !== undefined ? meters(Math.max(0, next.cumulativeDistance - entry.cumulativeDistance)) : meters(0);
    return { maneuver: entry.maneuver, segmentDistance };
  });
}

export interface RouteProgress {
  readonly distanceRemaining: Meters;
  // Distance entre la position actuelle et le point du tracé le plus
  // proche — au-delà de OFF_ROUTE_THRESHOLD_METERS, considérer hors trajet.
  readonly distanceFromRoute: Meters;
  // Estimation proportionnelle à partir de la durée totale Valhalla — pas la
  // vitesse réelle du pilote (voir RouteProgressModel.totalDuration).
  readonly durationRemaining: Seconds;
  readonly nextManeuver: ManeuverDto | undefined;
  readonly distanceToNextManeuver: Meters | undefined;
  // Limitation du tronçon en cours. undefined quand elle est inconnue du
  // moteur de routage, ou hors trajet : la limitation d'une route qu'on ne
  // suit plus ne dit rien de celle où l'on roule.
  readonly speedLimitMps: number | undefined;
}

// Un point à la jonction de deux portions appartient à la suivante (`<` sur
// endIndex) : c'est la limitation de la portion qui commence qui compte, y
// compris quand elle est inconnue. Seul le dernier point du tracé, qui n'a
// pas de portion suivante, garde celle de la portion qui s'achève.
function findSpeedLimitMps(model: RouteProgressModel, pathIndex: number): number | undefined {
  const isLastPoint = pathIndex === model.path.length - 1;
  return model.speedLimits.find(
    (segment) =>
      pathIndex >= segment.startIndex &&
      (pathIndex < segment.endIndex || (isLastPoint && pathIndex === segment.endIndex)),
  )?.speedLimitMps;
}

// `>` strict, pas `>=` : une manœuvre exactement à la position courante vient
// d'être franchie, ce n'est plus la prochaine.
export function computeRouteProgress(model: RouteProgressModel, position: GeoPointDto): RouteProgress {
  const { index, distance } = findNearestPathPoint(model.path, position);
  const progress = model.cumulativeDistances[index] ?? meters(0);
  const distanceRemaining = meters(Math.max(0, model.totalDistance - progress));
  const remainingRatio = model.totalDistance > 0 ? distanceRemaining / model.totalDistance : 0;
  const durationRemaining = seconds(model.totalDuration * remainingRatio);

  const upcoming = model.maneuverProgress.find((entry) => entry.cumulativeDistance > progress);

  return {
    distanceRemaining,
    distanceFromRoute: distance,
    durationRemaining,
    nextManeuver: upcoming?.maneuver,
    distanceToNextManeuver:
      upcoming !== undefined ? meters(Math.max(0, upcoming.cumulativeDistance - progress)) : undefined,
    speedLimitMps:
      distance > OFF_ROUTE_THRESHOLD_METERS ? undefined : findSpeedLimitMps(model, index),
  };
}
