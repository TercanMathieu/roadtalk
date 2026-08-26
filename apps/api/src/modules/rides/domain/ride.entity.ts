import type {
  Meters,
  MetersPerSecond,
  Result,
  RideId,
  RouteId,
  Seconds,
  TimestampMs,
  UserId,
} from '@roadtalk/domain-shared';
import { err, ok } from '@roadtalk/domain-shared';

/**
 * Cycle de vie : planned -> active -> completed
 *                planned|active -> cancelled
 * Modélisé en union discriminée pour rendre les états illégaux
 * irreprésentables (ex. un CompletedRide a toujours un summary).
 */
export type RideStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface RideSummary {
  readonly distanceMeters: Meters;
  readonly durationSeconds: Seconds;
  readonly averageSpeedMps: MetersPerSecond;
  readonly maxSpeedMps: MetersPerSecond;
  readonly elevationGainMeters: Meters;
}

interface RideBase {
  readonly id: RideId;
  readonly ownerId: UserId;
  readonly routeId: RouteId | undefined;
  // Toujours [ownerId] en V1. Le tableau existe dès maintenant pour que le
  // groupe temps réel (V2) n'oblige pas à réécrire le cycle de vie de Ride.
  readonly participantIds: readonly UserId[];
}

export interface PlannedRide extends RideBase {
  readonly status: 'planned';
}

export interface ActiveRide extends RideBase {
  readonly status: 'active';
  readonly startedAt: TimestampMs;
}

export interface CompletedRide extends RideBase {
  readonly status: 'completed';
  readonly startedAt: TimestampMs;
  readonly endedAt: TimestampMs;
  readonly summary: RideSummary;
}

export interface CancelledRide extends RideBase {
  readonly status: 'cancelled';
}

export type Ride = PlannedRide | ActiveRide | CompletedRide | CancelledRide;

export type RideTransitionError =
  | { readonly type: 'invalid_status'; readonly from: RideStatus; readonly expected: RideStatus }
  | { readonly type: 'end_before_start' };

export function planRide(params: {
  readonly id: RideId;
  readonly ownerId: UserId;
  readonly routeId?: RouteId;
}): PlannedRide {
  return {
    id: params.id,
    ownerId: params.ownerId,
    routeId: params.routeId,
    participantIds: [params.ownerId],
    status: 'planned',
  };
}

export function startRide(
  ride: Ride,
  startedAt: TimestampMs,
): Result<ActiveRide, RideTransitionError> {
  if (ride.status !== 'planned') {
    return err({ type: 'invalid_status', from: ride.status, expected: 'planned' });
  }

  return ok({
    id: ride.id,
    ownerId: ride.ownerId,
    routeId: ride.routeId,
    participantIds: ride.participantIds,
    status: 'active',
    startedAt,
  });
}

export function completeRide(
  ride: Ride,
  summary: RideSummary,
  endedAt: TimestampMs,
): Result<CompletedRide, RideTransitionError> {
  if (ride.status !== 'active') {
    return err({ type: 'invalid_status', from: ride.status, expected: 'active' });
  }

  if (endedAt < ride.startedAt) {
    return err({ type: 'end_before_start' });
  }

  return ok({
    id: ride.id,
    ownerId: ride.ownerId,
    routeId: ride.routeId,
    participantIds: ride.participantIds,
    status: 'completed',
    startedAt: ride.startedAt,
    endedAt,
    summary,
  });
}

export function cancelRide(ride: Ride): Result<CancelledRide, RideTransitionError> {
  if (ride.status === 'completed' || ride.status === 'cancelled') {
    return err({ type: 'invalid_status', from: ride.status, expected: 'planned' });
  }

  return ok({
    id: ride.id,
    ownerId: ride.ownerId,
    routeId: ride.routeId,
    participantIds: ride.participantIds,
    status: 'cancelled',
  });
}
