import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';

import { ErrorCode } from '@roadtalk/contracts';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { AccessTokenService } from '../../../src/infrastructure/auth/access-token.service';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { type AppErrorBody,AppException } from '../../../src/infrastructure/errors/app-exception';
import { AuthService } from '../../../src/modules/auth/auth.service';
import type { AppleTokenVerifier } from '../../../src/modules/auth/provider-token-verifer';
import type { GoogleTokenVerifier } from '../../../src/modules/auth/provider-token-verifer';
import { UsersService } from '../../../src/modules/users/users.service';

const apiRoot = path.resolve(__dirname, '../../..');

// Même hachage que le service, qui ne l'exporte pas : on ne stocke jamais un
// refresh token en clair, donc le retrouver en base passe par son empreinte.
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function expectErrorCode(promise: Promise<unknown>, code: ErrorCode): Promise<void> {
  try {
    await promise;
    expect.unreachable(`devait rejeter avec le code ${code}`);
  } catch (error) {
    expect(error).toBeInstanceOf(AppException);
    const body = (error as AppException).getResponse() as AppErrorBody;
    expect(body.code).toBe(code);
  }
}

describe('AuthService (intégration, vraie Postgres via Testcontainers)', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaService;
  let authService: AuthService;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgis/postgis:16-3.4').start();
    const databaseUrl = container.getConnectionUri();

    execSync('pnpm exec prisma db push --skip-generate', {
      cwd: apiRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe',
    });

    prisma = new PrismaService({ datasources: { db: { url: databaseUrl } } });
    await prisma.$connect();

    const usersService = new UsersService(prisma);
    const accessTokenService = new AccessTokenService();

    // Doublures pour Apple/Google : on teste ici la logique métier d'AuthService
    // (rotation, détection de réemploi), pas la vérification OIDC elle-même —
    // ça, c'est la responsabilité de `jose`, déjà testée par sa propre suite.
    const appleVerifyMock = vi.fn().mockResolvedValue({
      subject: 'apple-subject-1',
      email: 'rider@roadtalk.app',
      firstName: 'Marie',
      lastName: 'Dupont',
    });
    const appleTokenVerifier = { verify: appleVerifyMock } as unknown as AppleTokenVerifier;
    const googleTokenVerifier = { verify: vi.fn() } as unknown as GoogleTokenVerifier;

    authService = new AuthService(
      prisma,
      usersService,
      accessTokenService,
      appleTokenVerifier,
      googleTokenVerifier,
    );
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  it('loginWithApple crée un user et retourne une paire de tokens', async () => {
    const tokens = await authService.loginWithApple('fake-id-token');

    expect(tokens.accessToken).toEqual(expect.any(String));
    expect(tokens.refreshToken).toEqual(expect.any(String));
  });

  it('refresh fait tourner le refresh token : nouveau token, ancien inutilisable', async () => {
    const first = await authService.loginWithApple('fake-id-token');

    const rotated = await authService.refresh(first.refreshToken);

    expect(rotated.refreshToken).not.toBe(first.refreshToken);
    await expectErrorCode(authService.refresh(first.refreshToken), ErrorCode.AUTH_REFRESH_TOKEN_REUSED);
  });

  it('réutiliser un refresh token révoqué révoque aussi la session issue de sa rotation', async () => {
    const login = await authService.loginWithApple('fake-id-token');
    const rotated = await authService.refresh(login.refreshToken);

    // login.refreshToken est déjà révoqué (rotation ci-dessus) : le réutiliser
    // doit être traité comme un vol potentiel et couper la session qui en découle.
    await expectErrorCode(authService.refresh(login.refreshToken), ErrorCode.AUTH_REFRESH_TOKEN_REUSED);
    // rotated.refreshToken existe toujours en base mais a été révoqué par la
    // ligne précédente (révocation en masse) : même code, pas "introuvable".
    await expectErrorCode(authService.refresh(rotated.refreshToken), ErrorCode.AUTH_REFRESH_TOKEN_REUSED);
  });

  it('refresh avec un token totalement inconnu échoue avec AUTH_REFRESH_TOKEN_INVALID', async () => {
    await expectErrorCode(
      authService.refresh('un-token-qui-n-existe-pas'),
      ErrorCode.AUTH_REFRESH_TOKEN_INVALID,
    );
  });

  it('logout révoque le refresh token', async () => {
    const login = await authService.loginWithApple('fake-id-token');

    await authService.logout(login.refreshToken);

    await expectErrorCode(authService.refresh(login.refreshToken), ErrorCode.AUTH_REFRESH_TOKEN_REUSED);
  });

  it('refresh avec un token expiré échoue avec AUTH_REFRESH_TOKEN_EXPIRED', async () => {
    const login = await authService.loginWithApple('fake-id-token');

    // On fait vieillir le jeton en base plutôt que d'attendre 30 jours.
    await prisma.refreshToken.update({
      where: { tokenHash: hashToken(login.refreshToken) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await expectErrorCode(
      authService.refresh(login.refreshToken),
      ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED,
    );
  });

  it('un token expiré ET révoqué est traité comme un réemploi, la détection de vol primant sur la date', async () => {
    const login = await authService.loginWithApple('fake-id-token');
    await authService.refresh(login.refreshToken);

    await prisma.refreshToken.update({
      where: { tokenHash: hashToken(login.refreshToken) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await expectErrorCode(
      authService.refresh(login.refreshToken),
      ErrorCode.AUTH_REFRESH_TOKEN_REUSED,
    );
  });

  it('supprime les refresh tokens expirés du user à chaque émission', async () => {
    const login = await authService.loginWithApple('fake-id-token');
    const { userId } = await prisma.refreshToken.findFirstOrThrow({
      where: { tokenHash: { not: '' } },
      orderBy: { createdAt: 'desc' },
      select: { userId: true },
    });

    // Une trace ancienne, telle qu'en accumulerait un usage prolongé.
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: 'hash-d-un-token-expire',
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    });

    await authService.refresh(login.refreshToken);

    const survivor = await prisma.refreshToken.findUnique({
      where: { tokenHash: 'hash-d-un-token-expire' },
    });
    expect(survivor).toBeNull();
  });

  it('conserve un token révoqué mais non expiré, sans quoi la détection de vol serait désarmée', async () => {
    const login = await authService.loginWithApple('fake-id-token');

    // La rotation révoque `login.refreshToken` sans l'expirer : il doit
    // rester en base pour que son réemploi reste reconnaissable.
    const rotated = await authService.refresh(login.refreshToken);
    await authService.refresh(rotated.refreshToken);

    const revoked = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(login.refreshToken) },
    });
    expect(revoked).not.toBeNull();
    expect(revoked?.revokedAt).not.toBeNull();

    // Et la conséquence qui compte vraiment : le réemploi est toujours
    // détecté comme tel, pas confondu avec un jeton inconnu.
    await expectErrorCode(
      authService.refresh(login.refreshToken),
      ErrorCode.AUTH_REFRESH_TOKEN_REUSED,
    );
  });
});
