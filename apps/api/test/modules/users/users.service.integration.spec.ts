import { execSync } from 'node:child_process';
import path from 'node:path';

import { ErrorCode, type UserDto } from '@roadtalk/contracts';
import { createUserId, toUserId } from '@roadtalk/domain-shared';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { type AppErrorBody,AppException } from '../../../src/infrastructure/errors/app-exception';
import { UsernameModerationService } from '../../../src/modules/users/username-moderation.service';
import { UsersService } from '../../../src/modules/users/users.service';
import { POSTGIS_IMAGE } from '../../support/postgis-image';

const apiRoot = path.resolve(__dirname, '../../..');

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

describe('UsersService (intégration, vraie Postgres via Testcontainers)', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaService;
  let service: UsersService;

  beforeAll(async () => {
    container = await new PostgreSqlContainer(POSTGIS_IMAGE).start();
    const databaseUrl = container.getConnectionUri();

    // `db push` plutôt que `migrate deploy` : on veut juste synchroniser le
    // schéma sur une base éphémère, pas rejouer/valider l'historique de migration.
    execSync('pnpm exec prisma db push --skip-generate', {
      cwd: apiRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe',
    });

    prisma = new PrismaService({ datasources: { db: { url: databaseUrl } } });
    await prisma.$connect();
    service = new UsersService(prisma);
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  it('getById lève USER_NOT_FOUND pour un id inexistant', async () => {
    await expectErrorCode(service.getById(createUserId()), ErrorCode.USER_NOT_FOUND);
  });

  it('findOrCreateFromOAuth crée un user puis getById le retrouve', async () => {
    const created = await service.findOrCreateFromOAuth({
      provider: 'apple',
      providerUserId: 'apple-create-1',
      email: 'create-1@roadtalk.app',
      firstName: 'Marie',
      lastName: 'Dupont',
    });

    const found = await service.getById(toUserId(created.id));

    expect(found).toEqual(created);
    expect(created.provider).toBe('apple');
  });

  it('findOrCreateFromOAuth est idempotent pour la même identité OAuth', async () => {
    const profile = {
      provider: 'google' as const,
      providerUserId: 'google-idempotent-1',
      email: 'idempotent-1@roadtalk.app',
      firstName: 'Jean',
      lastName: 'Martin',
    };

    const first = await service.findOrCreateFromOAuth(profile);
    const second = await service.findOrCreateFromOAuth(profile);

    expect(second.id).toBe(first.id);
    expect(first.provider).toBe('google');
  });

  it('update ne modifie que les champs fournis', async () => {
    const created = await service.findOrCreateFromOAuth({
      provider: 'apple',
      providerUserId: 'apple-update-1',
      email: 'update-1@roadtalk.app',
      firstName: 'Ancien',
      lastName: 'Nom',
    });

    const updated = await service.update(toUserId(created.id), { firstName: 'Nouveau' });

    expect(updated.firstName).toBe('Nouveau');
    expect(updated.lastName).toBe('Nom');
  });

  it('update lève USER_NOT_FOUND pour un id inexistant', async () => {
    await expectErrorCode(
      service.update(createUserId(), { firstName: 'X' }),
      ErrorCode.USER_NOT_FOUND,
    );
  });

  it('delete supprime un user existant, un getById suivant lève USER_NOT_FOUND', async () => {
    const created = await service.findOrCreateFromOAuth({
      provider: 'apple',
      providerUserId: 'apple-delete-1',
      email: 'delete-1@roadtalk.app',
      firstName: 'A',
      lastName: 'Supprimer',
    });

    await service.delete(toUserId(created.id));

    await expectErrorCode(service.getById(toUserId(created.id)), ErrorCode.USER_NOT_FOUND);
  });

  it('delete sur un id déjà supprimé lève USER_NOT_FOUND (pas une exception Prisma brute)', async () => {
    const created = await service.findOrCreateFromOAuth({
      provider: 'apple',
      providerUserId: 'apple-delete-2',
      email: 'delete-2@roadtalk.app',
      firstName: 'B',
      lastName: 'Supprimer',
    });
    await service.delete(toUserId(created.id));

    await expectErrorCode(service.delete(toUserId(created.id)), ErrorCode.USER_NOT_FOUND);
  });

  async function createUserForHandle(suffix: string): Promise<UserDto> {
    return service.findOrCreateFromOAuth({
      provider: 'apple',
      providerUserId: `apple-handle-${suffix}`,
      email: `handle-${suffix}@roadtalk.app`,
      firstName: 'A',
      lastName: 'Pseudo',
    });
  }

  it("setHandle attribue un identifiant à un user qui n'en a pas, casse conservée", async () => {
    const created = await createUserForHandle('first');
    expect(created.username).toBeNull();
    expect(created.tag).toBeNull();

    const updated = await service.setHandle(toUserId(created.id), 'Motard_1', 'BCDF');

    expect(updated.username).toBe('Motard_1');
    expect(updated.tag).toBe('BCDF');
    // Le premier choix ne lance pas le délai de 3 mois.
    expect(updated.usernameChangeAllowedAt).toBeNull();
  });

  it('setHandle accepte le même pseudo pour deux users si le tag diffère', async () => {
    const first = await createUserForHandle('same-name-1');
    const second = await createUserForHandle('same-name-2');

    await service.setHandle(toUserId(first.id), 'Jumeau', 'BCDF');
    const updated = await service.setHandle(toUserId(second.id), 'Jumeau', 'GHJK');

    expect(updated.username).toBe('Jumeau');
    expect(updated.tag).toBe('GHJK');
  });

  it('setHandle lève USERNAME_ALREADY_TAKEN si la paire est prise, sans tenir compte de la casse', async () => {
    const first = await createUserForHandle('taken-1');
    const second = await createUserForHandle('taken-2');
    await service.setHandle(toUserId(first.id), 'PseudoPris', 'BCDF');

    await expectErrorCode(
      service.setHandle(toUserId(second.id), 'pseudopris', 'BCDF'),
      ErrorCode.USERNAME_ALREADY_TAKEN,
    );
  });

  it('setHandle lève USERNAME_NOT_ALLOWED pour un pseudo refusé par le filtre', async () => {
    const created = await createUserForHandle('filtered');

    await expectErrorCode(
      service.setHandle(toUserId(created.id), 'c0nnard', 'BCDF'),
      ErrorCode.USERNAME_NOT_ALLOWED,
    );
  });

  it('setHandle autorise un premier changement, puis refuse le suivant avant 3 mois', async () => {
    const created = await createUserForHandle('cooldown');
    const id = toUserId(created.id);
    await service.setHandle(id, 'Premier', 'BCDF');

    const changed = await service.setHandle(id, 'Deuxieme', 'BCDF');
    expect(changed.username).toBe('Deuxieme');
    expect(changed.usernameChangeAllowedAt).toBeGreaterThan(Date.now());

    await expectErrorCode(service.setHandle(id, 'Troisieme', 'BCDF'), ErrorCode.USERNAME_CHANGE_TOO_SOON);
  });

  it('setHandle lève USER_NOT_FOUND pour un id inexistant', async () => {
    await expectErrorCode(service.setHandle(createUserId(), 'x_y_z', 'BCDF'), ErrorCode.USER_NOT_FOUND);
  });

  it('suggestHandle propose un tag libre, différent de ceux déjà pris pour ce pseudo', async () => {
    const created = await createUserForHandle('suggest');
    await service.setHandle(toUserId(created.id), 'Populaire', 'BCDF');

    const suggestion = await service.suggestHandle('populaire');

    expect(suggestion.username).toBe('populaire');
    expect(suggestion.tag).toMatch(/^[BCDFGHJKLMNPQRSTVWXZ]{4}$/);
    expect(suggestion.tag).not.toBe('BCDF');
  });

  it('suggestHandle lève USERNAME_NOT_ALLOWED pour un pseudo refusé par le filtre', async () => {
    await expectErrorCode(service.suggestHandle('salope'), ErrorCode.USERNAME_NOT_ALLOWED);
  });

  describe('modération', () => {
    it('rejectHandle retire l\'identifiant, lève le délai et bloque le pseudo', async () => {
      const moderation = new UsernameModerationService(prisma);
      const created = await createUserForHandle('moderation-reject');
      const id = toUserId(created.id);
      await service.setHandle(id, 'Douteux', 'BCDF');
      await service.setHandle(id, 'Douteux2', 'BCDF');

      expect(await moderation.rejectHandle('douteux2', 'bcdf')).toBe(true);

      const afterReject = await service.getById(id);
      expect(afterReject.username).toBeNull();
      expect(afterReject.tag).toBeNull();
      expect(afterReject.usernameRejectedAt).not.toBeNull();
      // Le délai de 3 mois ne doit pas empêcher de choisir un autre pseudo.
      expect(afterReject.usernameChangeAllowedAt).toBeNull();

      await expectErrorCode(service.setHandle(id, 'Douteux2', 'GHJK'), ErrorCode.USERNAME_NOT_ALLOWED);

      const renamed = await service.setHandle(id, 'Correct', 'GHJK');
      expect(renamed.username).toBe('Correct');
      expect(renamed.usernameRejectedAt).toBeNull();
    });

    it("rejectHandle renvoie false pour un identifiant qu'aucun compte ne porte", async () => {
      const moderation = new UsernameModerationService(prisma);

      expect(await moderation.rejectHandle('Personne', 'BCDF')).toBe(false);
    });

    it('un terme bloqué s\'applique immédiatement, et se débloque', async () => {
      const moderation = new UsernameModerationService(prisma);
      const created = await createUserForHandle('moderation-block');

      await moderation.blockTerm('Bouffon', 'contains');
      await expectErrorCode(service.suggestHandle('gros_bouffon'), ErrorCode.USERNAME_NOT_ALLOWED);
      await expectErrorCode(
        service.setHandle(toUserId(created.id), 'b0uffon', 'BCDF'),
        ErrorCode.USERNAME_NOT_ALLOWED,
      );

      expect(await moderation.unblockTerm('bouffon')).toBe(true);
      const suggestion = await service.suggestHandle('gros_bouffon');
      expect(suggestion.username).toBe('gros_bouffon');
    });

    it('listRecentHandles liste les pseudos choisis récemment', async () => {
      const moderation = new UsernameModerationService(prisma);
      const created = await createUserForHandle('moderation-recent');
      await service.setHandle(toUserId(created.id), 'Nouveau_Venu', 'BCDF');

      const recent = await moderation.listRecentHandles(7);

      expect(recent.map((entry) => entry.handle)).toContain('Nouveau_Venu#BCDF');
    });
  });

  it('refuse deux identités OAuth différentes avec le même email (contrainte unique)', async () => {
    const email = 'duplicate@roadtalk.app';
    await service.findOrCreateFromOAuth({
      provider: 'apple',
      providerUserId: 'apple-duplicate-1',
      email,
      firstName: 'Premier',
      lastName: 'User',
    });

    await expect(
      service.findOrCreateFromOAuth({
        provider: 'google',
        providerUserId: 'google-duplicate-1',
        email,
        firstName: 'Second',
        lastName: 'User',
      }),
    ).rejects.toThrow();
  });
});
