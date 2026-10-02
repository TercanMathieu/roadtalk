import type { RideId, UserId } from '@roadtalk/domain-shared';

import type { CompletedRide } from '../domain/ride.entity';
import type { TrackPoint } from '../domain/track-point';

// Regroupe l'entité de domaine (invariants métier) et les données qui n'en
// font pas partie (nom éditable par l'utilisateur, tracé brut) — voir
// rides.service.ts pour le raisonnement complet.
export interface RideRecord {
  readonly ride: CompletedRide;
  readonly name: string;
  readonly isFavorite: boolean;
  readonly track: readonly TrackPoint[];
}

// Version allégée pour la liste (écran Historique) : pas le tracé complet,
// potentiellement des milliers de points par balade.
export interface RideListEntry {
  readonly ride: CompletedRide;
  readonly name: string;
  readonly isFavorite: boolean;
}

// Jeton d'injection NestJS pour ce port : une interface TypeScript n'existe
// plus à l'exécution, Nest a besoin d'une valeur concrète pour résoudre
// quelle implémentation injecter (voir rides.module.ts).
export const RIDE_REPOSITORY = Symbol('RIDE_REPOSITORY');

// Port (ADR-001) : l'application ne dépend que de cette interface, jamais de
// Prisma directement — l'implémentation concrète vit en infrastructure.
export interface RideRepository {
  save(record: RideRecord): Promise<void>;
  findAllByOwner(ownerId: UserId): Promise<readonly RideListEntry[]>;
  findByIdForOwner(id: RideId, ownerId: UserId): Promise<RideRecord | undefined>;
  // true si une ligne a bien été supprimée — distingue "rien à faire" de
  // "cette balade n'existe pas ou n'appartient pas à cet utilisateur", pour
  // que la couche présentation puisse répondre 404 dans le second cas.
  deleteByIdForOwner(id: RideId, ownerId: UserId): Promise<boolean>;
  // Même sémantique de retour que deleteByIdForOwner, pour la même raison.
  setFavoriteByIdForOwner(id: RideId, ownerId: UserId, isFavorite: boolean): Promise<boolean>;
  // Même sémantique de retour que deleteByIdForOwner, pour la même raison.
  renameByIdForOwner(id: RideId, ownerId: UserId, name: string): Promise<boolean>;
}
