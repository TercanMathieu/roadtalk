import { createHash, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { ErrorCode, type TokenPairDto } from '@roadtalk/contracts';
import { toUserId, type UserId } from '@roadtalk/domain-shared';

import { AccessTokenService } from '../../infrastructure/auth/access-token.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AppException } from '../../infrastructure/errors/app-exception';
import { UsersService } from '../users/users.service';
import { AppleTokenVerifier } from './provider-token-verifer';
import { GoogleTokenVerifier } from './provider-token-verifer';

const REFRESH_TOKEN_TTL_DAYS = 30;
const REFRESH_TOKEN_BYTES = 32;
// Apple ne renvoie le nom qu'à la toute première autorisation (et seulement
// côté client) ; Google le donne presque toujours. Si aucun nom n'est
// disponible à la création du compte, on utilise ce repli plutôt que
// d'échouer — l'utilisateur peut le corriger ensuite via PATCH /users/me.
const FALLBACK_FIRST_NAME = 'Nouveau';
const FALLBACK_LAST_NAME = 'Motard';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly accessTokenService: AccessTokenService,
    private readonly appleTokenVerifier: AppleTokenVerifier,
    private readonly googleTokenVerifier: GoogleTokenVerifier,
  ) {}

  async loginWithApple(idToken: string, firstName?: string, lastName?: string): Promise<TokenPairDto> {
    const claims = await this.appleTokenVerifier.verify(idToken);

    const user = await this.usersService.findOrCreateFromOAuth({
      provider: 'apple',
      providerUserId: claims.subject,
      email: claims.email,
      firstName: firstName ?? claims.firstName ?? FALLBACK_FIRST_NAME,
      lastName: lastName ?? claims.lastName ?? FALLBACK_LAST_NAME,
    });

    return this.issueTokenPair(toUserId(user.id));
  }

  async loginWithGoogle(idToken: string): Promise<TokenPairDto> {
    const claims = await this.googleTokenVerifier.verify(idToken);

    const user = await this.usersService.findOrCreateFromOAuth({
      provider: 'google',
      providerUserId: claims.subject,
      email: claims.email,
      firstName: claims.firstName ?? FALLBACK_FIRST_NAME,
      lastName: claims.lastName ?? FALLBACK_LAST_NAME,
    });

    return this.issueTokenPair(toUserId(user.id));
  }

  async refresh(refreshToken: string): Promise<TokenPairDto> {
    const tokenHash = hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored) {
      throw new AppException(ErrorCode.AUTH_REFRESH_TOKEN_INVALID);
    }

    if (stored.revokedAt !== null) {
      // Un token déjà révoqué qu'on tente de réutiliser est le signal
      // classique d'un vol de token : on révoque toutes les sessions actives
      // de ce user par précaution, pas seulement celle-ci.
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new AppException(ErrorCode.AUTH_REFRESH_TOKEN_REUSED);
    }

    if (stored.expiresAt < new Date()) {
      throw new AppException(ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED);
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(toUserId(stored.userId));
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokenPair(userId: UserId): Promise<TokenPairDto> {
    const accessToken = await this.accessTokenService.issue(userId);
    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}
