import { execSync } from 'node:child_process';
import path from 'node:path';

import {
  degrees,
  meters,
  metersPerSecond,
  timestampMs,
  toRideId,
  toUserId,
} from '@roadtalk/domain-shared';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { RidesService } from '../../../src/modules/rides/application/rides.service';
import type { TrackPoint } from '../../../src/modules/rides/domain/track-point';
import { PrismaRideRepository } from '../../../src/modules/rides/infrastructure/prisma-ride.repository';
import { UsersService } from '../../../src/modules/users/users.service';
import { POSTGIS_IMAGE } from '../../support/postgis-image';

const apiRoot = path.resolve(__dirname, '../../..');

// Trois points à Paris, ~1,2 km au total, 3 minutes — assez espacés pour
// dépasser largement MIN_SEGMENT_METERS et produire un résumé non nul.
const track: readonly TrackPoint[] = [
  {
    position: { latitude: degrees(48.8566), longitude: degrees(2.3522) },
    recordedAt: timestampMs(1_700_000_000_000),
    accuracyMeters: meters(8),
    speedMps: metersPerSecond(10),
    altitudeMeters: meters(35),
  },
  {
    position: { latitude: degrees(48.8606), longitude: degrees(2.3560) },
    recordedAt: timestampMs(1_700_000_090_000),
    accuracyMeters: meters(7),
    speedMps: metersPerSecond(12),
    altitudeMeters: meters(42),
  },
  {
    position: { latitude: degrees(48.8656), longitude: degrees(2.3610) },
    recordedAt: timestampMs(1_700_000_180_000),
    accuracyMeters: meters(9),
    speedMps: metersPerSecond(8),
    altitudeMeters: meters(55),
  },
];

describe('RidesService (intégration, vraie Postgres via Testcontainers)', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaService;
  let service: RidesService;
  let usersService: UsersService;

  beforeAll(async () => {
    container = await new PostgreSqlContainer(POSTGIS_IMAGE).start();
    const databaseUrl = container.getConnectionUri();

    execSync('pnpm exec prisma db push --skip-generate', {
      cwd: apiRoot,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe',
    });

    prisma = new PrismaService({ datasources: { db: { url: databaseUrl } } });
    await prisma.$connect();
    service = new RidesService(new PrismaRideRepository(prisma));
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

  it("renvoie une liste vide pour un utilisateur qui n'a jamais sauvegardé de balade", async () => {
    const user = await createUser('rides-empty');

    const list = await service.listForOwner(toUserId(user.id));

    expect(list).toEqual([]);
  });

  it('saveCompleted calcule le résumé côté serveur (jamais une valeur fournie par le client)', async () => {
    const user = await createUser('rides-save');

    const result = await service.saveCompleted({
      ownerId: toUserId(user.id),
      name: 'Balade du dimanche',
      startedAt: timestampMs(1_700_000_000_000),
      endedAt: timestampMs(1_700_000_180_000),
      track,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.name).toBe('Balade du dimanche');
    expect(result.value.ride.summary.distanceMeters).toBeGreaterThan(900);
    expect(result.value.ride.summary.durationSeconds).toBe(180);
    expect(result.value.ride.summary.elevationGainMeters).toBeGreaterThanOrEqual(0);
  });

  it('refuse une fin antérieure au départ (cycle de vie du domaine respecté)', async () => {
    const user = await createUser('rides-invalid-dates');

    const result = await service.saveCompleted({
      ownerId: toUserId(user.id),
      name: 'Balade impossible',
      startedAt: timestampMs(1_700_000_180_000),
      endedAt: timestampMs(1_700_000_000_000),
      track,
    });

    expect(result).toEqual({ ok: false, error: { type: 'end_before_start' } });
  });

  it('list -> get -> delete : cycle complet sur une balade sauvegardée', async () => {
    const user = await createUser('rides-lifecycle');
    const ownerId = toUserId(user.id);

    const saved = await service.saveCompleted({
      ownerId,
      name: 'Col de la Machine',
      startedAt: timestampMs(1_700_000_000_000),
      endedAt: timestampMs(1_700_000_180_000),
      track,
    });
    if (!saved.ok) throw new Error('setup failed');

    const list = await service.listForOwner(ownerId);
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe('Col de la Machine');

    const detail = await service.getForOwner(saved.value.ride.id, ownerId);
    expect(detail?.track).toHaveLength(track.length);
    expect(detail?.track[0]?.position.latitude).toBeCloseTo(48.8566, 3);

    const deleted = await service.deleteForOwner(saved.value.ride.id, ownerId);
    expect(deleted).toBe(true);

    const afterDelete = await service.getForOwner(saved.value.ride.id, ownerId);
    expect(afterDelete).toBeUndefined();
  });

  it("getForOwner renvoie undefined pour la balade d'un autre utilisateur (IDOR)", async () => {
    const owner = await createUser('rides-owner');
    const stranger = await createUser('rides-stranger');

    const saved = await service.saveCompleted({
      ownerId: toUserId(owner.id),
      name: 'Balade privée',
      startedAt: timestampMs(1_700_000_000_000),
      endedAt: timestampMs(1_700_000_180_000),
      track,
    });
    if (!saved.ok) throw new Error('setup failed');

    const stolen = await service.getForOwner(saved.value.ride.id, toUserId(stranger.id));

    expect(stolen).toBeUndefined();
  });

  it('deleteForOwner renvoie false pour une balade inexistante', async () => {
    const user = await createUser('rides-delete-missing');

    const deleted = await service.deleteForOwner(toRideId(crypto.randomUUID()), toUserId(user.id));

    expect(deleted).toBe(false);
  });

  it('setFavoriteForOwner bascule isFavorite et le reflète dans la liste', async () => {
    const user = await createUser('rides-favorite');
    const ownerId = toUserId(user.id);

    const saved = await service.saveCompleted({
      ownerId,
      name: 'Balade à mettre en favori',
      startedAt: timestampMs(1_700_000_000_000),
      endedAt: timestampMs(1_700_000_180_000),
      track,
    });
    if (!saved.ok) throw new Error('setup failed');
    expect(saved.value.isFavorite).toBe(false);

    const updated = await service.setFavoriteForOwner(saved.value.ride.id, ownerId, true);
    expect(updated).toBe(true);

    const list = await service.listForOwner(ownerId);
    expect(list[0]?.isFavorite).toBe(true);

    const unset = await service.setFavoriteForOwner(saved.value.ride.id, ownerId, false);
    expect(unset).toBe(true);
    const listAfterUnset = await service.listForOwner(ownerId);
    expect(listAfterUnset[0]?.isFavorite).toBe(false);
  });

  it("setFavoriteForOwner renvoie false pour la balade d'un autre utilisateur (IDOR)", async () => {
    const owner = await createUser('rides-favorite-owner');
    const stranger = await createUser('rides-favorite-stranger');

    const saved = await service.saveCompleted({
      ownerId: toUserId(owner.id),
      name: 'Balade privée',
      startedAt: timestampMs(1_700_000_000_000),
      endedAt: timestampMs(1_700_000_180_000),
      track,
    });
    if (!saved.ok) throw new Error('setup failed');

    const stolen = await service.setFavoriteForOwner(saved.value.ride.id, toUserId(stranger.id), true);

    expect(stolen).toBe(false);
  });

  it('renameForOwner modifie le nom et le reflète dans la liste', async () => {
    const user = await createUser('rides-rename');
    const ownerId = toUserId(user.id);

    const saved = await service.saveCompleted({
      ownerId,
      name: 'Nom original',
      startedAt: timestampMs(1_700_000_000_000),
      endedAt: timestampMs(1_700_000_180_000),
      track,
    });
    if (!saved.ok) throw new Error('setup failed');

    const updated = await service.renameForOwner(saved.value.ride.id, ownerId, 'Nouveau nom');
    expect(updated).toBe(true);

    const list = await service.listForOwner(ownerId);
    expect(list[0]?.name).toBe('Nouveau nom');
  });

  it("renameForOwner renvoie false pour la balade d'un autre utilisateur (IDOR)", async () => {
    const owner = await createUser('rides-rename-owner');
    const stranger = await createUser('rides-rename-stranger');

    const saved = await service.saveCompleted({
      ownerId: toUserId(owner.id),
      name: 'Balade privée',
      startedAt: timestampMs(1_700_000_000_000),
      endedAt: timestampMs(1_700_000_180_000),
      track,
    });
    if (!saved.ok) throw new Error('setup failed');

    const stolen = await service.renameForOwner(saved.value.ride.id, toUserId(stranger.id), 'Volé');

    expect(stolen).toBe(false);
  });
});
