import { randomUUID } from 'node:crypto';

import type { Brand } from './brand';

export type UserId = Brand<string, 'UserId'>;
export type RideId = Brand<string, 'RideId'>;
export type RouteId = Brand<string, 'RouteId'>;

export function createUserId(): UserId {
  return randomUUID() as UserId;
}

export function createRideId(): RideId {
  return randomUUID() as RideId;
}

export function createRouteId(): RouteId {
  return randomUUID() as RouteId;
}

// Seul point sanctionné pour transformer un UUID déjà validé (ex. par
// ParseUUIDPipe ou un schéma Zod) en UserId — jamais un `as UserId` ailleurs.
export function toUserId(value: string): UserId {
  return value as UserId;
}
