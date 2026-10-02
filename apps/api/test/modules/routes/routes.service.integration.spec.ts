import { execSync } from 'node:child_process';
import path from 'node:path';

import { degrees, meters, seconds, toRouteId, toUserId } from '@roadtalk/domain-shared';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { RoutesService } from '../../../src/modules/routes/application/routes.service';
import { PrismaRouteRepository } from '../../../src/modules/routes/infrastructure/prisma-route.repository';
import { UsersService } from '../../../src/modules/users/users.service';

const apiRoot = path.resolve(__dirname, '../../..');

const paris = { latitude: degrees(48.8566), longitude: degrees(2.3522) };
const lyon = { latitude: degrees(45.764), longitude: degrees(4.8357) };

describe('RoutesService (intégration, vraie Postgres via Testcontainers)', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaService;
  let service: RoutesService;
  let usersService: UsersService;

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
    service = new RoutesService(new PrismaRouteRepository(prisma));
    usersService = new UsersService(prisma);
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  async function createUser(providerUserId: string): ReturnType<typeof usersService.findOrCreateFromOAuth> {
    return usersService.findOrCreateFromOAuth({
      provider: 'google',
      providerUserId,
      email: `${providerUserId}@roadtalk.app`,
      firstName: 'Test',
      lastName: 'User',
    });
  }

  it("renvoie une liste vide pour un utilisateur qui n'a jamais sauvegardé d'itinéraire", async () => {
    const user = await createUser('routes-empty');

    const list = await service.listForAuthor(toUserId(user.id));

    expect(list).toEqual([]);
  });

  it('save attache la distance/durée fournies mais jamais de dénivelé inventé', async () => {
    const user = await createUser('routes-save');

    const result = await service.save({
      authorId: toUserId(user.id),
      name: 'Paris - Lyon',
      waypoints: [paris, lyon],
      routingOptions: { avoidHighways: false, avoidTolls: false },
      distanceMeters: meters(465_000),
      durationSeconds: seconds(16_200),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.name).toBe('Paris - Lyon');
    expect(result.value.distanceMeters).toBe(465_000);
    expect(result.value.elevationGainMeters).toBeUndefined();
    expect(result.value.source).toBe('planned');
  });

  it("refuse un itinéraire d'un seul point", async () => {
    const user = await createUser('routes-invalid');

    const result = await service.save({
      authorId: toUserId(user.id),
      name: undefined,
      waypoints: [paris],
      routingOptions: { avoidHighways: false, avoidTolls: false },
      distanceMeters: undefined,
      durationSeconds: undefined,
    });

    expect(result).toEqual({ ok: false, error: { type: 'not_enough_waypoints', count: 1 } });
  });

  it('list -> get -> delete : cycle complet sur un itinéraire sauvegardé', async () => {
    const user = await createUser('routes-lifecycle');
    const authorId = toUserId(user.id);

    const saved = await service.save({
      authorId,
      name: 'Col de la Machine',
      waypoints: [paris, lyon],
      routingOptions: { avoidHighways: true, avoidTolls: false },
      distanceMeters: undefined,
      durationSeconds: undefined,
    });
    if (!saved.ok) throw new Error('setup failed');

    const list = await service.listForAuthor(authorId);
    expect(list).toHaveLength(1);
    expect(list[0]?.routingOptions.avoidHighways).toBe(true);

    const detail = await service.getForAuthor(saved.value.id, authorId);
    expect(detail?.waypoints).toEqual([paris, lyon]);

    const deleted = await service.deleteForAuthor(saved.value.id, authorId);
    expect(deleted).toBe(true);

    const afterDelete = await service.getForAuthor(saved.value.id, authorId);
    expect(afterDelete).toBeUndefined();
  });

  it("getForAuthor renvoie undefined pour l'itinéraire d'un autre utilisateur (IDOR)", async () => {
    const owner = await createUser('routes-owner');
    const stranger = await createUser('routes-stranger');

    const saved = await service.save({
      authorId: toUserId(owner.id),
      name: 'Itinéraire privé',
      waypoints: [paris, lyon],
      routingOptions: { avoidHighways: false, avoidTolls: false },
      distanceMeters: undefined,
      durationSeconds: undefined,
    });
    if (!saved.ok) throw new Error('setup failed');

    const stolen = await service.getForAuthor(saved.value.id, toUserId(stranger.id));

    expect(stolen).toBeUndefined();
  });

  it('deleteForAuthor renvoie false pour un itinéraire inexistant', async () => {
    const user = await createUser('routes-delete-missing');

    const deleted = await service.deleteForAuthor(toRouteId(crypto.randomUUID()), toUserId(user.id));

    expect(deleted).toBe(false);
  });

  it('renameForAuthor modifie le nom et le reflète dans la liste', async () => {
    const user = await createUser('routes-rename');
    const authorId = toUserId(user.id);

    const saved = await service.save({
      authorId,
      name: 'Nom original',
      waypoints: [paris, lyon],
      routingOptions: { avoidHighways: false, avoidTolls: false },
      distanceMeters: undefined,
      durationSeconds: undefined,
    });
    if (!saved.ok) throw new Error('setup failed');

    const updated = await service.renameForAuthor(saved.value.id, authorId, 'Nouveau nom');
    expect(updated).toBe(true);

    const list = await service.listForAuthor(authorId);
    expect(list[0]?.name).toBe('Nouveau nom');
  });

  it("renameForAuthor renvoie false pour l'itinéraire d'un autre utilisateur (IDOR)", async () => {
    const owner = await createUser('routes-rename-owner');
    const stranger = await createUser('routes-rename-stranger');

    const saved = await service.save({
      authorId: toUserId(owner.id),
      name: 'Itinéraire privé',
      waypoints: [paris, lyon],
      routingOptions: { avoidHighways: false, avoidTolls: false },
      distanceMeters: undefined,
      durationSeconds: undefined,
    });
    if (!saved.ok) throw new Error('setup failed');

    const stolen = await service.renameForAuthor(saved.value.id, toUserId(stranger.id), 'Volé');

    expect(stolen).toBe(false);
  });
});
