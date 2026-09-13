import { createHash, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type { RefreshToken } from '@prisma/client';
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
    const stored = await this.loadUsableRefreshToken(hashToken(refreshToken));

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(toUserId(stored.userId));
  }

  /**
   * Seul chemin de lecture d'un refresh token destiné à être utilisé : charge
   * la ligne et refuse tout ce qui n'est pas utilisable, avec un code distinct
   * par cause. Tout nouvel appelant doit passer par ici — c'est ce qui garantit
   * qu'aucune des trois vérifications ne puisse être oubliée en chemin.
   *
   * Volontairement pas de filtrage dans la requête (`expiresAt: { gt: now }`) :
   * ça confondrait « expiré » et « inconnu » en un seul `INVALID`, alors que
   * la distinction est utile au diagnostic — et l'ordre compte, un jeton
   * révoqué doit déclencher la détection de vol avant tout examen de sa date.
   */
  private async loadUsableRefreshToken(tokenHash: string): Promise<RefreshToken> {
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

    return stored;
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

    await this.purgeExpiredTokens(userId);

    return { accessToken, refreshToken };
  }

  /**
   * La rotation crée une ligne à chaque renouvellement — environ une par
   * quart d'heure d'usage actif — et rien ne les supprimait : de la donnée
   * personnelle conservée sans limite, ce qu'interdit C4.
   *
   * Seuls les jetons **expirés** sont supprimés. Un jeton révoqué mais encore
   * valide doit rester en base : c'est lui qui permet de reconnaître un
   * réemploi, donc de détecter un vol. L'effacer trop tôt transformerait ce
   * signal en simple « jeton inconnu » et désarmerait la détection.
   *
   * Purge opportuniste plutôt que tâche planifiée : bornée à un utilisateur,
   * sur l'index `userId` existant, elle évite d'attendre la mise en place
   * d'un ordonnanceur. Une purge globale restera utile le jour où des comptes
   * cesseront de se connecter — leurs jetons ne seraient jamais balayés ici.
   */
  private async purgeExpiredTokens(userId: UserId): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });
  }
}
