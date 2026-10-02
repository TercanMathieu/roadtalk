import type { RouteId, UserId } from '@roadtalk/domain-shared';

import type { Route } from '../domain/route.entity';

// Jeton d'injection NestJS — voir le port équivalent côté rides pour le
// raisonnement complet.
export const ROUTE_REPOSITORY = Symbol('ROUTE_REPOSITORY');

// Port (ADR-001) : l'application ne dépend que de cette interface, jamais de
// Prisma directement — l'implémentation concrète vit en infrastructure.
export interface RouteRepository {
  save(route: Route): Promise<void>;
  findAllByAuthor(authorId: UserId): Promise<readonly Route[]>;
  findByIdForAuthor(id: RouteId, authorId: UserId): Promise<Route | undefined>;
  // true si une ligne a bien été supprimée — distingue "rien à faire" de
  // "cet itinéraire n'existe pas ou n'appartient pas à cet utilisateur".
  deleteByIdForAuthor(id: RouteId, authorId: UserId): Promise<boolean>;
  // Même sémantique de retour que deleteByIdForAuthor, pour la même raison.
  renameByIdForAuthor(id: RouteId, authorId: UserId, name: string): Promise<boolean>;
}
