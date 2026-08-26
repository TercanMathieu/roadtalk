import { Injectable } from '@nestjs/common';
import { Prisma, type User as UserRow } from '@prisma/client';
import { ErrorCode, type UpdateUserDto, type UserDto } from '@roadtalk/contracts';
import { createUserId, type UserId } from '@roadtalk/domain-shared';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AppException } from '../../infrastructure/errors/app-exception';

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

function isUniqueConstraintError(error: unknown, field: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }
  const target = error.meta?.['target'];
  return Array.isArray(target) && target.includes(field);
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

  async setUsername(id: UserId, username: string): Promise<UserDto> {
    try {
      const row = await this.prisma.user.update({ where: { id }, data: { username } });
      return toDto(row);
    } catch (error) {
      if (isUniqueConstraintError(error, 'username')) {
        throw new AppException(ErrorCode.USERNAME_ALREADY_TAKEN, `Pseudo "${username}" déjà pris`);
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

function toDto(row: UserRow): UserDto {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    username: row.username,
    createdAt: row.createdAt.getTime(),
  };
}
