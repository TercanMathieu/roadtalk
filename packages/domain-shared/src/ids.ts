import type { Brand } from './brand';

// `crypto.randomUUID()` global (Web Crypto), pas `import { randomUUID } from
// 'node:crypto'` : ce package est importé aussi bien par l'API (Node) que
// par le mobile (Metro/Hermes, qui ne peut pas résoudre les modules `node:*`
// même si le code n'est pas exécuté côté mobile — juste bundlé). Disponible
// nativement en Node 19+. Ces fonctions ne sont pour l'instant appelées que
// côté API ; si le mobile devait un jour créer un ID lui-même, vérifier
// d'abord que `crypto.randomUUID` est bien polyfillé sur Hermes.
export type UserId = Brand<string, 'UserId'>;
export type RideId = Brand<string, 'RideId'>;
export type RouteId = Brand<string, 'RouteId'>;

export function createUserId(): UserId {
  return crypto.randomUUID() as UserId;
}

export function createRideId(): RideId {
  return crypto.randomUUID() as RideId;
}

export function createRouteId(): RouteId {
  return crypto.randomUUID() as RouteId;
}

// Seul point sanctionné pour transformer un UUID déjà validé (ex. par
// ParseUUIDPipe ou un schéma Zod) en UserId — jamais un `as UserId` ailleurs.
export function toUserId(value: string): UserId {
  return value as UserId;
}
