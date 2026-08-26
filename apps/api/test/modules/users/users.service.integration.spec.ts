import { execSync } from 'node:child_process';
import path from 'node:path';

import { ErrorCode } from '@roadtalk/contracts';
import { createUserId, toUserId } from '@roadtalk/domain-shared';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { type AppErrorBody,AppException } from '../../../src/infrastructure/errors/app-exception';
import { UsersService } from '../../../src/modules/users/users.service';

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
    container = await new PostgreSqlContainer('postgis/postgis:16-3.4').start();
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

  it('setUsername attribue un pseudo à un user qui n\'en a pas', async () => {
    const created = await service.findOrCreateFromOAuth({
      provider: 'apple',
      providerUserId: 'apple-username-1',
      email: 'username-1@roadtalk.app',
      firstName: 'A',
      lastName: 'Pseudo',
    });
    expect(created.username).toBeNull();

    const updated = await service.setUsername(toUserId(created.id), 'motard_1');

    expect(updated.username).toBe('motard_1');
  });

  it('setUsername permet de changer un pseudo déjà choisi', async () => {
    const created = await service.findOrCreateFromOAuth({
      provider: 'apple',
      providerUserId: 'apple-username-2',
      email: 'username-2@roadtalk.app',
      firstName: 'B',
      lastName: 'Pseudo',
    });
    await service.setUsername(toUserId(created.id), 'ancien_pseudo');

    const updated = await service.setUsername(toUserId(created.id), 'nouveau_pseudo');

    expect(updated.username).toBe('nouveau_pseudo');
  });

  it('setUsername lève USERNAME_ALREADY_TAKEN si le pseudo est déjà pris', async () => {
    const first = await service.findOrCreateFromOAuth({
      provider: 'apple',
      providerUserId: 'apple-username-3',
      email: 'username-3@roadtalk.app',
      firstName: 'C',
      lastName: 'Pseudo',
    });
    await service.setUsername(toUserId(first.id), 'pseudo_pris');

    const second = await service.findOrCreateFromOAuth({
      provider: 'google',
      providerUserId: 'google-username-3',
      email: 'username-3b@roadtalk.app',
      firstName: 'D',
      lastName: 'Pseudo',
    });

    await expectErrorCode(
      service.setUsername(toUserId(second.id), 'pseudo_pris'),
      ErrorCode.USERNAME_ALREADY_TAKEN,
    );
  });

  it('setUsername lève USER_NOT_FOUND pour un id inexistant', async () => {
    await expectErrorCode(service.setUsername(createUserId(), 'x_y_z'), ErrorCode.USER_NOT_FOUND);
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
