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

// Point le plus proche parmi path[fromIndex..toIndex] — pas une projection
// sur les segments du tracé. Une projection point-segment serait plus
// précise mais inutile ici, l'écart reste sous la précision du GPS lui-même.
function findNearestPathPoint(
  path: readonly GeoPointDto[],
  position: GeoPointDto,
  fromIndex = 0,
  toIndex = path.length - 1,
): NearestPoint {
  const positionPoint = toGeoPoint(position);
  let nearestIndex = fromIndex;
  let nearestDistance = meters(Number.POSITIVE_INFINITY);

  for (let i = fromIndex; i <= toIndex; i += 1) {
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

// Fenêtre de recherche autour de la dernière position connue sur le tracé.
// Sans elle, un trajet qui repasse au même endroit (boucle, aller-retour)
// faisait sauter la progression d'un passage à l'autre : au départ d'une
// boucle, le point le plus proche pouvait être l'arrivée, et le guidage se
// terminait aussitôt. Un peu en arrière pour absorber le bruit GPS, assez
// loin en avant pour survivre à une courte perte de signal (tunnel) ; au-delà,
// la position est traitée comme hors itinéraire et le trajet est recalculé.
const SEARCH_WINDOW_BEHIND_METERS = 50;
const SEARCH_WINDOW_AHEAD_METERS = 400;

function findSearchWindow(
  cumulativeDistances: readonly Meters[],
  previousIndex: number,
): { readonly fromIndex: number; readonly toIndex: number } {
  const previousDistance = cumulativeDistances[previousIndex] ?? meters(0);
  const lastIndex = cumulativeDistances.length - 1;

  let fromIndex = previousIndex;
  while (fromIndex > 0 && previousDistance - (cumulativeDistances[fromIndex - 1] ?? 0) <= SEARCH_WINDOW_BEHIND_METERS) {
    fromIndex -= 1;
  }

  let toIndex = previousIndex;
  while (
    toIndex < lastIndex &&
    (cumulativeDistances[toIndex + 1] ?? 0) - previousDistance <= SEARCH_WINDOW_AHEAD_METERS
  ) {
    toIndex += 1;
  }

  return { fromIndex, toIndex };
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

  // Les manœuvres sont dans l'ordre de parcours : chacune se cherche à partir
  // de la précédente, jamais sur tout le tracé — sur une boucle, un point
  // traversé deux fois serait sinon rattaché au mauvais passage.
  let searchFromIndex = 0;
  const maneuverProgress = route.maneuvers.map((maneuver) => {
    const { index } = findNearestPathPoint(route.path, maneuver.point, searchFromIndex);
    searchFromIndex = index;
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
  // Distance à parcourir depuis la manœuvre précédente pour atteindre
  // celle-ci ("dans 300 m, tournez à droite") — 0 pour la toute première.
  readonly distanceFromPrevious: Meters;
}

// Récapitulatif complet du trajet (toutes les manœuvres, pas seulement la
// prochaine) — pour le panneau "étapes" déplié depuis le pied de guidage, pas
// pour l'affichage glanceable en roulant (voir ManeuverBanner).
export function getManeuverSteps(model: RouteProgressModel): readonly ManeuverStep[] {
  return model.maneuverProgress.map((entry, index) => {
    const previous = model.maneuverProgress[index - 1];
    const distanceFromPrevious =
      previous !== undefined ? meters(Math.max(0, entry.cumulativeDistance - previous.cumulativeDistance)) : meters(0);
    return { maneuver: entry.maneuver, distanceFromPrevious };
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
  // Index, dans `path`, du point du tracé retenu pour cette position — à
  // repasser au calcul suivant (voir computeRouteProgress, `previousIndex`).
  readonly pathIndex: number;
  readonly nextManeuver: ManeuverDto | undefined;
  // Position de `nextManeuver` dans la liste des manœuvres du trajet (même
  // ordre que getManeuverSteps) — undefined quand il n'y en a plus.
  readonly nextManeuverIndex: number | undefined;
  readonly distanceToNextManeuver: Meters | undefined;
  // Manœuvre qui suit `nextManeuver`, seulement si elle arrive juste après
  // (voir THEN_MANEUVER_MAX_GAP_METERS) : deux virages enchaînés s'annoncent
  // ensemble ("à droite, puis à gauche"), sinon le second surprend.
  readonly thenManeuver: ManeuverDto | undefined;
  // Nombre d'arrêts déjà atteints (une manœuvre "destination" par arrêt) —
  // sert à ne pas renvoyer vers un arrêt déjà visité lors d'un recalcul.
  readonly stopsReached: number;
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

const THEN_MANEUVER_MAX_GAP_METERS = 150;

// `>` strict, pas `>=` : une manœuvre exactement à la position courante vient
// d'être franchie, ce n'est plus la prochaine.
//
// `previousIndex` : le `pathIndex` du calcul précédent sur ce même trajet. La
// recherche se limite alors à une fenêtre autour de lui (voir
// findSearchWindow). Absent (premier calcul), la fenêtre part du début du
// tracé : le guidage démarre toujours à l'origine de l'itinéraire.
export function computeRouteProgress(
  model: RouteProgressModel,
  position: GeoPointDto,
  previousIndex = 0,
): RouteProgress {
  const { fromIndex, toIndex } = findSearchWindow(model.cumulativeDistances, previousIndex);
  const nearest = findNearestPathPoint(model.path, position, fromIndex, toIndex);
  const isOffRoute = nearest.distance > OFF_ROUTE_THRESHOLD_METERS;
  // Hors itinéraire, la progression ne bouge pas : le point "le plus proche"
  // d'une position qui a quitté le tracé ne dit rien de l'avancement réel.
  const index = isOffRoute ? previousIndex : nearest.index;
  const progress = model.cumulativeDistances[index] ?? meters(0);
  const distanceRemaining = meters(Math.max(0, model.totalDistance - progress));
  const remainingRatio = model.totalDistance > 0 ? distanceRemaining / model.totalDistance : 0;
  const durationRemaining = seconds(model.totalDuration * remainingRatio);

  const upcomingIndex = model.maneuverProgress.findIndex((entry) => entry.cumulativeDistance > progress);
  const upcoming = model.maneuverProgress[upcomingIndex];
  const following = upcoming !== undefined ? model.maneuverProgress[upcomingIndex + 1] : undefined;
  const isFollowingClose =
    upcoming !== undefined &&
    following !== undefined &&
    following.cumulativeDistance - upcoming.cumulativeDistance <= THEN_MANEUVER_MAX_GAP_METERS;

  return {
    distanceRemaining,
    distanceFromRoute: nearest.distance,
    durationRemaining,
    pathIndex: index,
    nextManeuver: upcoming?.maneuver,
    nextManeuverIndex: upcoming !== undefined ? upcomingIndex : undefined,
    distanceToNextManeuver:
      upcoming !== undefined ? meters(Math.max(0, upcoming.cumulativeDistance - progress)) : undefined,
    thenManeuver: isFollowingClose ? following.maneuver : undefined,
    stopsReached: model.maneuverProgress.filter(
      (entry) => entry.maneuver.type === 'destination' && entry.cumulativeDistance <= progress,
    ).length,
    speedLimitMps: isOffRoute ? undefined : findSpeedLimitMps(model, index),
  };
}
