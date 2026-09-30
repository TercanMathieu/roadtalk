import { execSync } from 'node:child_process';
import path from 'node:path';

import { toUserId } from '@roadtalk/domain-shared';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { SearchHistoryService } from '../../../src/modules/search-history/search-history.service';
import { UsersService } from '../../../src/modules/users/users.service';

const apiRoot = path.resolve(__dirname, '../../..');

const paris = { label: 'Paris', context: 'France', latitude: 48.8566, longitude: 2.3522 };
const lyon = { label: 'Lyon', context: 'France', latitude: 45.764, longitude: 4.8357 };
const marseille = { label: 'Marseille', context: 'France', latitude: 43.2965, longitude: 5.3698 };

// L'ordre de l'historique dépend de `selectedAt`, colonne au 1/1000e de
// seconde (@db.Timestamptz(3)). Sur une machine assez rapide, des appels
// enchaînés sans délai peuvent retomber sur la même milliseconde — situation
// qu'un vrai utilisateur ne rencontre jamais (impossible de cliquer deux fois
// en moins d'une milliseconde), mais qui rend un test enchaînant les
// sélections instable selon la vitesse de la machine qui l'exécute (observé
// en CI, jamais en local). Ce délai n'est là que pour garantir des instants
// distincts, pas pour attendre quoi que ce soit côté service.
function waitPastTimestampPrecision(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 5));
}

describe('SearchHistoryService (intégration, vraie Postgres via Testcontainers)', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaService;
  let service: SearchHistoryService;
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
    service = new SearchHistoryService(prisma);
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

  it("renvoie un historique vide pour un utilisateur qui n'a jamais rien sélectionné", async () => {
    const user = await createUser('history-empty');

    const history = await service.list(toUserId(user.id));

    expect(history.entries).toEqual([]);
  });

  it('recordSelection rend une adresse visible dans list', async () => {
    const user = await createUser('history-basic');

    await service.recordSelection(toUserId(user.id), paris);
    const history = await service.list(toUserId(user.id));

    expect(history.entries).toHaveLength(1);
    expect(history.entries[0]).toMatchObject({ label: 'Paris', context: 'France' });
  });

  it('reclique la même adresse sans dupliquer la ligne', async () => {
    const user = await createUser('history-dedup');

    await service.recordSelection(toUserId(user.id), paris);
    await service.recordSelection(toUserId(user.id), paris);
    await service.recordSelection(toUserId(user.id), paris);
    const history = await service.list(toUserId(user.id));

    expect(history.entries).toHaveLength(1);
  });

  it('reclique une adresse la remonte en tête de liste', async () => {
    const user = await createUser('history-reorder');

    await service.recordSelection(toUserId(user.id), paris);
    await waitPastTimestampPrecision();
    await service.recordSelection(toUserId(user.id), lyon);
    await waitPastTimestampPrecision();
    // Paris redevient la plus récente sélection.
    await service.recordSelection(toUserId(user.id), paris);
    const history = await service.list(toUserId(user.id));

    expect(history.entries.map((entry) => entry.label)).toEqual(['Paris', 'Lyon']);
  });

  it('ne mélange jamais l\'historique de deux utilisateurs différents', async () => {
    const alice = await createUser('history-alice');
    const bob = await createUser('history-bob');

    await service.recordSelection(toUserId(alice.id), paris);
    await service.recordSelection(toUserId(bob.id), marseille);

    const aliceHistory = await service.list(toUserId(alice.id));
    const bobHistory = await service.list(toUserId(bob.id));

    expect(aliceHistory.entries.map((entry) => entry.label)).toEqual(['Paris']);
    expect(bobHistory.entries.map((entry) => entry.label)).toEqual(['Marseille']);
  });

  it('plafonne à 5 entrées, en gardant les plus récentes', async () => {
    const user = await createUser('history-cap');
    const cities = [
      { label: 'Ville 1', context: null, latitude: 1, longitude: 1 },
      { label: 'Ville 2', context: null, latitude: 2, longitude: 2 },
      { label: 'Ville 3', context: null, latitude: 3, longitude: 3 },
      { label: 'Ville 4', context: null, latitude: 4, longitude: 4 },
      { label: 'Ville 5', context: null, latitude: 5, longitude: 5 },
      { label: 'Ville 6', context: null, latitude: 6, longitude: 6 },
    ];

    for (const city of cities) {
      await service.recordSelection(toUserId(user.id), city);
      await waitPastTimestampPrecision();
    }
    const history = await service.list(toUserId(user.id));

    expect(history.entries).toHaveLength(5);
    expect(history.entries.map((entry) => entry.label)).toEqual([
      'Ville 6',
      'Ville 5',
      'Ville 4',
      'Ville 3',
      'Ville 2',
    ]);
  });
});
