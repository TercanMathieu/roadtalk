import { execSync } from 'node:child_process';
import path from 'node:path';

import {
  type AddressSuggestionDto,
  ErrorCode,
  type GenerateAiRouteRequestDto,
  type GeoPointDto,
  type RouteGeometryDto,
} from '@roadtalk/contracts';
import { toUserId, type UserId } from '@roadtalk/domain-shared';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { env } from '../../../src/infrastructure/config/env';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { AppException } from '../../../src/infrastructure/errors/app-exception';
import {
  AiRoutesService,
  type PlaceFinder,
  type RouteCalculator,
} from '../../../src/modules/ai-routes/ai-routes.service';
import type {
  PlannerResult,
  RoutePlan,
  RoutePlanner,
} from '../../../src/modules/ai-routes/route-planner.port';
import { UsersService } from '../../../src/modules/users/users.service';
import { POSTGIS_IMAGE } from '../../support/postgis-image';

const apiRoot = path.resolve(__dirname, '../../..');

const grenoble: GeoPointDto = { latitude: 45.1885, longitude: 5.7245 };
const briancon: GeoPointDto = { latitude: 44.8986, longitude: 6.6435 };

const request: GenerateAiRouteRequestDto = {
  origin: grenoble,
  tripType: 'loop',
  durationMinutes: 150,
  sinuosity: 'winding',
  roadPreferences: ['avoidHighways'],
  stopKinds: [],
};

// Lieux connus du faux géocodeur, par nom proposé.
const KNOWN_PLACES: Readonly<Record<string, AddressSuggestionDto>> = {
  'Vizille, Isère': {
    label: 'Vizille',
    context: '38220, Vizille, France',
    latitude: 45.0786,
    longitude: 5.7708,
  },
  'Col de Porte, Isère': {
    label: 'Col de Porte',
    context: 'Sarcenas, France',
    latitude: 45.2914,
    longitude: 5.7681,
  },
  'Lans-en-Vercors, Isère': {
    label: 'Lans-en-Vercors',
    context: '38250, France',
    latitude: 45.1281,
    longitude: 5.5881,
  },
};

const plan: RoutePlan = {
  title: 'Tour de Grenoble',
  summary: 'Trois massifs en une boucle.',
  waypoints: [
    { name: 'Vizille', region: 'Isère', note: 'Château' },
    { name: 'Lans-en-Vercors', region: 'Isère', note: 'Plateau' },
    { name: 'Col de Porte', region: 'Isère', note: 'Chartreuse' },
  ],
};

const usage = { inputTokens: 1_000, outputTokens: 500 };

class FakePlanner implements RoutePlanner {
  readonly briefs: string[] = [];

  constructor(private readonly results: (PlannerResult | AppException)[]) {}

  plan(brief: string): Promise<PlannerResult> {
    this.briefs.push(brief);
    const next = this.results.shift();
    if (next === undefined) {
      throw new Error('appel au modèle non prévu par le test');
    }
    return next instanceof AppException ? Promise.reject(next) : Promise.resolve(next);
  }
}

const places: PlaceFinder = {
  reverseLocality: (point) =>
    Promise.resolve(
      point.latitude === briancon.latitude
        ? 'Briançon, Provence-Alpes-Côte d’Azur, France'
        : 'Grenoble, Auvergne-Rhône-Alpes, France',
    ),
  searchAddresses: (query) => {
    const found = KNOWN_PLACES[query];
    return Promise.resolve(found === undefined ? [] : [found]);
  },
};

class FakeRouter implements RouteCalculator {
  readonly calls: (readonly GeoPointDto[])[] = [];

  constructor(private readonly results: (number | AppException)[]) {}

  computeRoute(waypoints: readonly GeoPointDto[]): Promise<RouteGeometryDto> {
    this.calls.push(waypoints);
    const next = this.results.shift();
    if (next === undefined) {
      throw new Error('calcul de trajet non prévu par le test');
    }
    if (next instanceof AppException) {
      return Promise.reject(next);
    }
    return Promise.resolve({
      distanceMeters: next * 15,
      durationSeconds: next,
      path: [grenoble, { latitude: 45.2, longitude: 5.73 }],
      maneuvers: [],
      speedLimits: [],
    });
  }
}

describe('AiRoutesService (intégration, vraie Postgres via Testcontainers)', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaService;
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
    usersService = new UsersService(prisma);
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  async function createUser(providerUserId: string): Promise<UserId> {
    const user = await usersService.findOrCreateFromOAuth({
      provider: 'google',
      providerUserId,
      email: `${providerUserId}@roadtalk.app`,
      firstName: 'Test',
      lastName: 'User',
    });
    return toUserId(user.id);
  }

  async function generationsOf(
    userId: UserId,
  ): Promise<{ succeeded: boolean; inputTokens: number }[]> {
    return prisma.aiRouteGeneration.findMany({
      where: { userId },
      select: { succeeded: true, inputTokens: true },
    });
  }

  it('sert un itinéraire réel : lieux retrouvés sur la carte, boucle refermée sur le départ', async () => {
    const userId = await createUser('ai-success');
    const router = new FakeRouter([2.5 * 3_600]);
    const service = new AiRoutesService(prisma, new FakePlanner([{ plan, usage }]), places, router);

    const route = await service.generate(userId, request);

    expect(route.title).toBe('Tour de Grenoble');
    expect(route.waypoints.map((waypoint) => waypoint.label)).toEqual([
      'Vizille',
      'Lans-en-Vercors',
      'Col de Porte',
    ]);
    expect(route.waypoints[0]?.note).toBe('Château');
    expect(route.ending).toBe('start');
    expect(route.avoidHighways).toBe(true);
    expect(route.remainingToday).toBe(env.AI_ROUTE_DAILY_LIMIT - 1);
    expect(router.calls[0]?.[0]).toEqual(grenoble);
    expect(router.calls[0]?.at(-1)).toEqual(grenoble);
    expect(router.calls[0]).toHaveLength(5);
    expect(await generationsOf(userId)).toEqual([{ succeeded: true, inputTokens: 1_000 }]);
  });

  it('réessaie une fois une balade trop courte, en le disant au modèle', async () => {
    const userId = await createUser('ai-retry');
    const planner = new FakePlanner([
      { plan, usage },
      { plan, usage },
    ]);
    const router = new FakeRouter([1 * 3_600, 2.4 * 3_600]);
    const service = new AiRoutesService(prisma, planner, places, router);

    const route = await service.generate(userId, request);

    expect(route.geometry.durationSeconds).toBe(2.4 * 3_600);
    expect(planner.briefs[1]).toContain('Correction');
    expect(planner.briefs[1]).toContain('1 h 00 de route pour 2 h 30 visées');
    // Une seule génération du point de vue du quota, tokens cumulés.
    expect(await generationsOf(userId)).toEqual([{ succeeded: true, inputTokens: 2_000 }]);
  });

  it('sert la proposition la plus proche de la cible quand aucune ne tombe juste', async () => {
    const userId = await createUser('ai-closest');
    const planner = new FakePlanner([
      { plan, usage },
      { plan, usage },
    ]);
    const service = new AiRoutesService(
      prisma,
      planner,
      places,
      new FakeRouter([6 * 3_600, 1.2 * 3_600]),
    );

    const route = await service.generate(userId, request);

    expect(route.geometry.durationSeconds).toBe(1.2 * 3_600);
  });

  it('réessaie quand aucune route ne relie les lieux proposés', async () => {
    const userId = await createUser('ai-unreachable');
    const planner = new FakePlanner([
      { plan, usage },
      { plan, usage },
    ]);
    const router = new FakeRouter([new AppException(ErrorCode.ROUTE_NOT_FOUND), 2.5 * 3_600]);
    const service = new AiRoutesService(prisma, planner, places, router);

    await service.generate(userId, request);

    expect(planner.briefs[1]).toContain('Aucune route ne relie');
  });

  it("termine l'itinéraire à l'arrivée imposée, située pour le modèle par sa seule commune", async () => {
    const userId = await createUser('ai-destination');
    const planner = new FakePlanner([{ plan, usage }]);
    const router = new FakeRouter([2.5 * 3_600]);
    const service = new AiRoutesService(prisma, planner, places, router);

    const route = await service.generate(userId, {
      ...request,
      tripType: 'one-way',
      destination: briancon,
    });

    expect(route.ending).toBe('destination');
    expect(route.waypoints.map((waypoint) => waypoint.label)).not.toContain('Briançon');
    expect(router.calls[0]?.[0]).toEqual(grenoble);
    expect(router.calls[0]?.at(-1)).toEqual(briancon);
    expect(planner.briefs[0]).toContain(
      'arrivée imposée : Briançon, Provence-Alpes-Côte d’Azur, France',
    );
    expect(planner.briefs[0]).not.toContain(String(briancon.latitude));
  });

  it("refuse une arrivée hors d'atteinte avant tout appel, sans rien compter", async () => {
    const userId = await createUser('ai-destination-too-far');
    const paris = { latitude: 48.8566, longitude: 2.3522 };
    const planner = new FakePlanner([]);
    const service = new AiRoutesService(prisma, planner, places, new FakeRouter([]));

    await expect(
      service.generate(userId, { ...request, tripType: 'one-way', destination: paris }),
    ).rejects.toMatchObject({ code: ErrorCode.AI_ROUTE_DESTINATION_TOO_FAR });
    expect(planner.briefs).toEqual([]);
    expect(await generationsOf(userId)).toEqual([]);
  });

  it('compte dans le quota un échec qui a été facturé', async () => {
    const userId = await createUser('ai-failed');
    const planner = new FakePlanner([
      { plan: undefined, usage },
      { plan: { ...plan, waypoints: [{ name: 'Atlantide', region: 'Océan', note: '' }] }, usage },
    ]);
    const service = new AiRoutesService(prisma, planner, places, new FakeRouter([]));

    await expect(service.generate(userId, request)).rejects.toMatchObject({
      code: ErrorCode.AI_ROUTE_GENERATION_FAILED,
    });
    expect(await generationsOf(userId)).toEqual([{ succeeded: false, inputTokens: 2_000 }]);
  });

  it("ne compte rien quand le service d'IA est indisponible", async () => {
    const userId = await createUser('ai-unavailable');
    const planner = new FakePlanner([new AppException(ErrorCode.AI_ROUTE_UNAVAILABLE)]);
    const service = new AiRoutesService(prisma, planner, places, new FakeRouter([]));

    await expect(service.generate(userId, request)).rejects.toMatchObject({
      code: ErrorCode.AI_ROUTE_UNAVAILABLE,
    });
    expect(await generationsOf(userId)).toEqual([]);
  });

  it('refuse au-delà de la limite quotidienne, sans appeler le modèle', async () => {
    const userId = await createUser('ai-quota');
    await prisma.aiRouteGeneration.createMany({
      data: Array.from({ length: env.AI_ROUTE_DAILY_LIMIT }, () => ({
        userId,
        succeeded: true,
        inputTokens: 1,
        outputTokens: 1,
      })),
    });
    const planner = new FakePlanner([]);
    const service = new AiRoutesService(prisma, planner, places, new FakeRouter([]));

    await expect(service.generate(userId, request)).rejects.toMatchObject({
      code: ErrorCode.AI_ROUTE_QUOTA_EXCEEDED,
    });
    expect(planner.briefs).toEqual([]);
  });

  it('ne compte plus les générations de plus de 24 h', async () => {
    const userId = await createUser('ai-quota-window');
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await prisma.aiRouteGeneration.createMany({
      data: Array.from({ length: env.AI_ROUTE_DAILY_LIMIT }, () => ({
        userId,
        succeeded: true,
        inputTokens: 1,
        outputTokens: 1,
        createdAt: yesterday,
      })),
    });
    const service = new AiRoutesService(
      prisma,
      new FakePlanner([{ plan, usage }]),
      places,
      new FakeRouter([9_000]),
    );

    const route = await service.generate(userId, request);

    expect(route.remainingToday).toBe(env.AI_ROUTE_DAILY_LIMIT - 1);
  });
});
