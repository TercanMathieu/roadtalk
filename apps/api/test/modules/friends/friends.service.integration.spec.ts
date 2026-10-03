import { execSync } from 'node:child_process';
import path from 'node:path';

import { ErrorCode } from '@roadtalk/contracts';
import { toUserId, type UserId } from '@roadtalk/domain-shared';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import { FriendsService } from '../../../src/modules/friends/friends.service';
import { UsersService } from '../../../src/modules/users/users.service';
import { POSTGIS_IMAGE } from '../../support/postgis-image';

const apiRoot = path.resolve(__dirname, '../../..');

describe('FriendsService (intégration, vraie Postgres via Testcontainers)', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaService;
  let usersService: UsersService;
  let service: FriendsService;
  let userCount = 0;

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
    service = new FriendsService(prisma);
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  // Un motard avec un identifiant Pseudo#TAG, ou sans s'il n'en a pas encore choisi.
  async function rider(username?: string, tag = 'BCDF'): Promise<UserId> {
    userCount += 1;
    const user = await usersService.findOrCreateFromOAuth({
      provider: 'google',
      providerUserId: `friends-${String(userCount)}`,
      email: `friends-${String(userCount)}@roadtalk.app`,
      firstName: 'Prénom',
      lastName: 'Secret',
    });
    const id = toUserId(user.id);
    if (username !== undefined) {
      await usersService.setHandle(id, username, tag);
    }
    return id;
  }

  it('envoie une demande par Pseudo#TAG, sans tenir compte de la casse', async () => {
    const alice = await rider('Alice');
    const bruno = await rider('Bruno', 'KRTV');

    const aliceView = await service.sendRequest(alice, 'bruno#krtv');

    expect(aliceView.outgoing.map((request) => request.user.username)).toEqual(['Bruno']);
    const brunoView = await service.overview(bruno);
    expect(brunoView.incoming.map((request) => request.user.username)).toEqual(['Alice']);
  });

  it("ne montre d'un autre motard que son identifiant public, jamais son nom ni son e-mail (C4)", async () => {
    const alice = await rider('Alice', 'GHJK');
    const bruno = await rider('Bruno', 'GHJK');

    const view = await service.sendRequest(alice, 'Bruno#GHJK');

    expect(Object.keys(view.outgoing[0]?.user ?? {}).sort()).toEqual(['id', 'tag', 'username']);
    expect(JSON.stringify(await service.overview(bruno))).not.toContain('Secret');
  });

  it('accepter fait apparaître l’amitié des deux côtés', async () => {
    const alice = await rider('Alice', 'LMNP');
    const bruno = await rider('Bruno', 'LMNP');
    await service.sendRequest(alice, 'Bruno#LMNP');
    const requestId = (await service.overview(bruno)).incoming[0]?.id ?? '';

    const brunoView = await service.acceptRequest(bruno, requestId);

    expect(brunoView.friends.map((friend) => friend.user.username)).toEqual(['Alice']);
    expect(brunoView.incoming).toEqual([]);
    expect((await service.overview(alice)).friends.map((friend) => friend.user.username)).toEqual([
      'Bruno',
    ]);
  });

  it('seul le destinataire peut accepter une demande', async () => {
    const alice = await rider('Alice', 'QRST');
    await rider('Bruno', 'QRST');
    const requestId = (await service.sendRequest(alice, 'Bruno#QRST')).outgoing[0]?.id ?? '';

    await expect(service.acceptRequest(alice, requestId)).rejects.toMatchObject({
      code: ErrorCode.FRIEND_REQUEST_NOT_FOUND,
    });
  });

  it('une demande croisée vaut acceptation', async () => {
    const alice = await rider('Alice', 'VWXZ');
    const bruno = await rider('Bruno', 'VWXZ');
    await service.sendRequest(alice, 'Bruno#VWXZ');

    const brunoView = await service.sendRequest(bruno, 'Alice#VWXZ');

    expect(brunoView.friends.map((friend) => friend.user.username)).toEqual(['Alice']);
    expect(brunoView.incoming).toEqual([]);
    expect(
      await prisma.friendship.count({ where: { requesterId: alice, addresseeId: bruno } }),
    ).toBe(1);
  });

  it('refuse son propre identifiant, un identifiant inconnu, une demande en double', async () => {
    const alice = await rider('Alice', 'BBCC');
    await rider('Bruno', 'BBCC');

    await expect(service.sendRequest(alice, 'Alice#BBCC')).rejects.toMatchObject({
      code: ErrorCode.FRIEND_REQUEST_INVALID,
    });
    await expect(service.sendRequest(alice, 'Personne#BBCC')).rejects.toMatchObject({
      code: ErrorCode.FRIEND_HANDLE_NOT_FOUND,
    });
    await service.sendRequest(alice, 'Bruno#BBCC');
    await expect(service.sendRequest(alice, 'Bruno#BBCC')).rejects.toMatchObject({
      code: ErrorCode.FRIEND_ALREADY_CONNECTED,
    });
  });

  it("refuse d'envoyer une demande tant qu'on n'a pas soi-même d'identifiant", async () => {
    const anonymous = await rider();
    await rider('Bruno', 'DDFF');

    await expect(service.sendRequest(anonymous, 'Bruno#DDFF')).rejects.toMatchObject({
      code: ErrorCode.FRIEND_REQUEST_INVALID,
    });
  });

  it('refuser ou annuler une demande la fait disparaître des deux côtés', async () => {
    const alice = await rider('Alice', 'GGHH');
    const bruno = await rider('Bruno', 'GGHH');
    const chloe = await rider('Chloe', 'GGHH');
    await service.sendRequest(alice, 'Bruno#GGHH');
    await service.sendRequest(alice, 'Chloe#GGHH');

    const declined = (await service.overview(bruno)).incoming[0]?.id ?? '';
    await service.removeRequest(bruno, declined);
    const cancelled = (await service.overview(alice)).outgoing.find(
      (request) => request.user.username === 'Chloe',
    );
    const aliceView = await service.removeRequest(alice, cancelled?.id ?? '');

    expect(aliceView.outgoing).toEqual([]);
    expect((await service.overview(chloe)).incoming).toEqual([]);
  });

  it('retirer un ami le retire des deux côtés', async () => {
    const alice = await rider('Alice', 'JJKK');
    const bruno = await rider('Bruno', 'JJKK');
    await service.sendRequest(alice, 'Bruno#JJKK');
    await service.sendRequest(bruno, 'Alice#JJKK');

    await service.removeFriend(alice, bruno);

    expect((await service.overview(bruno)).friends).toEqual([]);
    await expect(service.removeFriend(alice, bruno)).rejects.toMatchObject({
      code: ErrorCode.FRIEND_REQUEST_NOT_FOUND,
    });
  });

  it("bloquer efface la demande et rend le bloqueur introuvable pour l'autre, sans le lui dire", async () => {
    const alice = await rider('Alice', 'LLMM');
    const bruno = await rider('Bruno', 'LLMM');
    await service.sendRequest(alice, 'Bruno#LLMM');

    const brunoView = await service.block(bruno, alice);

    expect(brunoView.incoming).toEqual([]);
    expect(brunoView.blocked.map((user) => user.username)).toEqual(['Alice']);
    await expect(service.sendRequest(alice, 'Bruno#LLMM')).rejects.toMatchObject({
      code: ErrorCode.FRIEND_HANDLE_NOT_FOUND,
    });
    await expect(service.sendRequest(bruno, 'Alice#LLMM')).rejects.toMatchObject({
      code: ErrorCode.FRIEND_REQUEST_INVALID,
    });

    await service.unblock(bruno, alice);
    expect((await service.sendRequest(alice, 'Bruno#LLMM')).outgoing).toHaveLength(1);
  });

  it('bloquer un ami met fin à l’amitié', async () => {
    const alice = await rider('Alice', 'NNPP');
    const bruno = await rider('Bruno', 'NNPP');
    await service.sendRequest(alice, 'Bruno#NNPP');
    await service.sendRequest(bruno, 'Alice#NNPP');

    await service.block(alice, bruno);

    expect((await service.overview(alice)).friends).toEqual([]);
    expect((await service.overview(bruno)).friends).toEqual([]);
  });

  it('limite les demandes envoyées sur 24 h', async () => {
    const alice = await rider('Alice', 'QQRR');
    const others = await Promise.all(
      Array.from({ length: 21 }, (_, index) => rider(`Motard${String(index)}`, 'QQRR')),
    );
    await prisma.friendship.createMany({
      data: others.slice(0, 20).map((other) => ({
        requesterId: alice,
        addresseeId: other,
        pairKey: alice < other ? `${alice}:${other}` : `${other}:${alice}`,
      })),
    });

    await expect(service.sendRequest(alice, 'Motard20#QQRR')).rejects.toMatchObject({
      code: ErrorCode.FRIEND_REQUEST_LIMIT,
    });
  });
});
