import { randomInt } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { Prisma, type User as UserRow } from '@prisma/client';
import {
  ErrorCode,
  type HandleSuggestionDto,
  TAG_ALPHABET,
  TAG_LENGTH,
  type UpdateUserDto,
  type UserDto,
} from '@roadtalk/contracts';
import { createUserId, type UserId } from '@roadtalk/domain-shared';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AppException } from '../../infrastructure/errors/app-exception';
import { loadBlockedTerms } from './blocked-terms';
import { isUsernameAllowed } from './username-policy';

export type OAuthProvider = 'apple' | 'google';

export interface OAuthProfile {
  readonly provider: OAuthProvider;
  readonly providerUserId: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
}

function isRecordNotFoundError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

// Un changement d'identifiant tous les 3 mois (décision produit, ADR-003) :
// assez rare pour qu'on ne change pas de nom afin d'échapper à un
// signalement, assez souple pour corriger un choix regretté.
const USERNAME_CHANGE_COOLDOWN_MS = 90 * 24 * 60 * 60 * 1000;
// 160 000 tags par pseudo : une collision au tirage est rare, quelques
// essais suffisent largement avant de conclure que le pseudo est saturé.
const TAG_DRAW_ATTEMPTS = 20;

// Forme de comparaison d'un pseudo : l'unicité se juge sans la casse.
function toUsernameKey(username: string): string {
  return username.toLowerCase();
}

function drawTag(): string {
  return Array.from({ length: TAG_LENGTH }, () => TAG_ALPHABET.charAt(randomInt(TAG_ALPHABET.length))).join('');
}

function usernameNotAllowed(): AppException {
  // Volontairement sans détail : dire quel mot a déclenché le refus
  // reviendrait à documenter comment contourner le filtre.
  return new AppException(ErrorCode.USERNAME_NOT_ALLOWED);
}

function userNotFound(id: UserId): AppException {
  return new AppException(ErrorCode.USER_NOT_FOUND, `User ${id} introuvable`);
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: UserId): Promise<UserDto> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    if (!row) {
      throw userNotFound(id);
    }
    return toDto(row);
  }

  async update(id: UserId, patch: UpdateUserDto): Promise<UserDto> {
    // exactOptionalPropertyTypes : une clé absente et une clé valant `undefined`
    // ne sont pas la même chose pour Prisma, donc on ne construit que les clés
    // réellement fournies plutôt que de passer `undefined` explicitement.
    const data: Prisma.UserUpdateInput = {
      ...(patch.firstName !== undefined ? { firstName: patch.firstName } : {}),
      ...(patch.lastName !== undefined ? { lastName: patch.lastName } : {}),
    };

    try {
      const row = await this.prisma.user.update({ where: { id }, data });
      return toDto(row);
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw userNotFound(id);
      }
      throw error;
    }
  }

  // Vérifie qu'un pseudo est acceptable et lui propose un tag libre. Rien
  // n'est réservé : la paire est confirmée (ou refusée) par setHandle.
  async suggestHandle(username: string): Promise<HandleSuggestionDto> {
    if (!isUsernameAllowed(username, await loadBlockedTerms(this.prisma))) {
      throw usernameNotAllowed();
    }

    const taken = await this.prisma.user.findMany({
      where: { usernameKey: toUsernameKey(username) },
      select: { tag: true },
    });
    const takenTags = new Set(taken.map((row) => row.tag));

    for (let attempt = 0; attempt < TAG_DRAW_ATTEMPTS; attempt += 1) {
      const tag = drawTag();
      if (!takenTags.has(tag)) {
        return { username, tag };
      }
    }

    throw new AppException(ErrorCode.USERNAME_ALREADY_TAKEN, 'Ce pseudo est trop demandé, choisis-en un autre');
  }

  // Enregistre l'identifiant "Pseudo#TAG". Le premier choix est libre ; un
  // changement ensuite n'est accepté qu'une fois tous les 3 mois.
  async setHandle(id: UserId, username: string, tag: string): Promise<UserDto> {
    if (!isUsernameAllowed(username, await loadBlockedTerms(this.prisma))) {
      throw usernameNotAllowed();
    }

    const current = await this.prisma.user.findUnique({ where: { id } });
    if (!current) {
      throw userNotFound(id);
    }

    if (current.username === username && current.tag === tag) {
      return toDto(current);
    }

    const allowedAt = usernameChangeAllowedAt(current);
    if (allowedAt !== null && allowedAt > Date.now()) {
      throw new AppException(ErrorCode.USERNAME_CHANGE_TOO_SOON, undefined, { allowedAt });
    }

    try {
      const row = await this.prisma.user.update({
        where: { id },
        data: {
          username,
          usernameKey: toUsernameKey(username),
          tag,
          usernameRejectedAt: null,
          // Le tout premier choix ne lance pas le délai : c'est remplir sa
          // fiche, pas changer d'identifiant.
          ...(current.username !== null ? { usernameChangedAt: new Date() } : {}),
        },
      });
      return toDto(row);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new AppException(ErrorCode.USERNAME_ALREADY_TAKEN, `"${username}#${tag}" est déjà pris`);
      }
      if (isRecordNotFoundError(error)) {
        throw userNotFound(id);
      }
      throw error;
    }
  }

  async delete(id: UserId): Promise<void> {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        throw userNotFound(id);
      }
      throw error;
    }
  }

  /**
   * Seul chemin de création d'un User — appelé par le flow OAuth une fois le
   * token Apple/Google vérifié (F1 : pas de mot de passe, pas de route publique
   * de création). Le flow appelant reste à construire.
   */
  async findOrCreateFromOAuth(profile: OAuthProfile): Promise<UserDto> {
    const where: Prisma.UserWhereUniqueInput =
      profile.provider === 'apple'
        ? { appleUserId: profile.providerUserId }
        : { googleUserId: profile.providerUserId };

    const existing = await this.prisma.user.findUnique({ where });
    if (existing) {
      return toDto(existing);
    }

    const created = await this.prisma.user.create({
      data: {
        id: createUserId(),
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        appleUserId: profile.provider === 'apple' ? profile.providerUserId : null,
        googleUserId: profile.provider === 'google' ? profile.providerUserId : null,
      },
    });

    return toDto(created);
  }
}

// null = l'identifiant peut être modifié dès maintenant (jamais changé
// depuis son premier choix, ou pas encore choisi).
function usernameChangeAllowedAt(row: UserRow): number | null {
  return row.usernameChangedAt !== null ? row.usernameChangedAt.getTime() + USERNAME_CHANGE_COOLDOWN_MS : null;
}

function toDto(row: UserRow): UserDto {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    username: row.username,
    tag: row.tag,
    usernameChangeAllowedAt: usernameChangeAllowedAt(row),
    usernameRejectedAt: row.usernameRejectedAt?.getTime() ?? null,
    createdAt: row.createdAt.getTime(),
    provider: row.appleUserId !== null ? 'apple' : 'google',
  };
}
