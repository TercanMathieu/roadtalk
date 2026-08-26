import type {
  Degrees,
  Meters,
  Result,
  RouteId,
  Seconds,
  TimestampMs,
  UserId,
} from '@roadtalk/domain-shared';
import { err, ok } from '@roadtalk/domain-shared';

export interface GeoPoint {
  readonly latitude: Degrees;
  readonly longitude: Degrees;
}

export interface RoutingOptions {
  readonly avoidHighways: boolean;
  readonly avoidTolls: boolean;
}

// Un Route créé à la main (F5) ou importé (F6, GPX) — distinct de Ride :
// un itinéraire est réutilisable et partageable, une balade est un événement daté.
export type RouteSource = 'planned' | 'gpx_import';

export interface Route {
  readonly id: RouteId;
  readonly authorId: UserId;
  readonly name: string | undefined;
  // Séquence ordonnée : premier point = départ, dernier = arrivée, le reste = étapes.
  readonly waypoints: readonly GeoPoint[];
  readonly routingOptions: RoutingOptions;
  readonly source: RouteSource;
  // Calculés par le service de routing (Valhalla, session 7) : absents à la création.
  readonly distanceMeters: Meters | undefined;
  readonly durationSeconds: Seconds | undefined;
  readonly elevationGainMeters: Meters | undefined;
  readonly createdAt: TimestampMs;
}

export type RouteValidationError =
  | { readonly type: 'not_enough_waypoints'; readonly count: number }
  | { readonly type: 'invalid_coordinates'; readonly point: GeoPoint };

const MIN_WAYPOINTS = 2;
const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

function isValidGeoPoint(point: GeoPoint): boolean {
  return (
    point.latitude >= MIN_LATITUDE &&
    point.latitude <= MAX_LATITUDE &&
    point.longitude >= MIN_LONGITUDE &&
    point.longitude <= MAX_LONGITUDE
  );
}

export function createRoute(params: {
  readonly id: RouteId;
  readonly authorId: UserId;
  readonly name?: string;
  readonly waypoints: readonly GeoPoint[];
  readonly routingOptions: RoutingOptions;
  readonly source: RouteSource;
  readonly createdAt: TimestampMs;
}): Result<Route, RouteValidationError> {
  if (params.waypoints.length < MIN_WAYPOINTS) {
    return err({ type: 'not_enough_waypoints', count: params.waypoints.length });
  }

  const invalidPoint = params.waypoints.find((point) => !isValidGeoPoint(point));
  if (invalidPoint !== undefined) {
    return err({ type: 'invalid_coordinates', point: invalidPoint });
  }

  return ok({
    id: params.id,
    authorId: params.authorId,
    name: params.name,
    waypoints: params.waypoints,
    routingOptions: params.routingOptions,
    source: params.source,
    distanceMeters: undefined,
    durationSeconds: undefined,
    elevationGainMeters: undefined,
    createdAt: params.createdAt,
  });
}

export function withComputedMetrics(
  route: Route,
  metrics: {
    readonly distanceMeters: Meters;
    readonly durationSeconds: Seconds;
    readonly elevationGainMeters: Meters;
  },
): Route {
  return {
    ...route,
    distanceMeters: metrics.distanceMeters,
    durationSeconds: metrics.durationSeconds,
    elevationGainMeters: metrics.elevationGainMeters,
  };
}
