import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode, type FriendsOverviewDto, type PublicUserDto } from '@roadtalk/contracts';
import type { UserId } from '@roadtalk/domain-shared';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AppException } from '../../infrastructure/errors/app-exception';

// Demandes envoyées par 24 h glissantes : de quoi ajouter ses amis d'un
// coup, pas de quoi arroser l'app de demandes.
const DAILY_REQUEST_LIMIT = 20;
const REQUEST_WINDOW_MS = 24 * 60 * 60 * 1000;

// Seuls champs lus sur un autre motard — jamais l'e-mail ni le nom (C4).
const PUBLIC_USER_SELECT = { id: true, username: true, tag: true } satisfies Prisma.UserSelect;

// Même clé quel que soit le sens : voir Friendship.pairKey.
function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function compareHandles(a: PublicUserDto, b: PublicUserDto): number {
  // Les identifiants retirés par la modération en dernier.
  return (a.username?.toLowerCase() ?? '￿').localeCompare(b.username?.toLowerCase() ?? '￿');
}

function requestNotFound(): AppException {
  return new AppException(ErrorCode.FRIEND_REQUEST_NOT_FOUND);
}

@Injectable()
export class FriendsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(userId: UserId): Promise<FriendsOverviewDto> {
    const [rows, blocks] = await Promise.all([
      this.prisma.friendship.findMany({
        where: { OR: [{ requesterId: userId }, { addresseeId: userId }] },
        include: {
          requester: { select: PUBLIC_USER_SELECT },
          addressee: { select: PUBLIC_USER_SELECT },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.userBlock.findMany({
        where: { blockerId: userId },
        include: { blocked: { select: PUBLIC_USER_SELECT } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const other = (row: (typeof rows)[number]): PublicUserDto =>
      row.requesterId === userId ? row.addressee : row.requester;

    return {
      friends: rows
        .flatMap((row) =>
          row.acceptedAt !== null ? [{ user: other(row), since: row.acceptedAt.getTime() }] : [],
        )
        .sort((a, b) => compareHandles(a.user, b.user)),
      incoming: rows
        .filter((row) => row.acceptedAt === null && row.addresseeId === userId)
        .map((row) => ({ id: row.id, user: row.requester, sentAt: row.createdAt.getTime() })),
      outgoing: rows
        .filter((row) => row.acceptedAt === null && row.requesterId === userId)
        .map((row) => ({ id: row.id, user: row.addressee, sentAt: row.createdAt.getTime() })),
      blocked: blocks.map((block) => block.blocked),
    };
  }

  // `handle` déjà validé au format Pseudo#TAG (friendHandleSchema).
  async sendRequest(userId: UserId, handle: string): Promise<FriendsOverviewDto> {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });
    const myUsername = me?.username ?? null;
    if (myUsername === null) {
      // Le destinataire doit savoir qui lui écrit.
      throw new AppException(
        ErrorCode.FRIEND_REQUEST_INVALID,
        "Choisis d'abord ton pseudo pour ajouter des amis.",
      );
    }

    const [username = '', tag = ''] = handle.split('#');
    const target = await this.prisma.user.findFirst({
      where: { usernameKey: username.toLowerCase(), tag: tag.toUpperCase() },
      select: { id: true },
    });
    if (target === null) {
      throw new AppException(ErrorCode.FRIEND_HANDLE_NOT_FOUND);
    }
    if (target.id === userId) {
      throw new AppException(ErrorCode.FRIEND_REQUEST_INVALID, "C'est ton propre identifiant.");
    }

    const blocks = await this.prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: userId, blockedId: target.id },
          { blockerId: target.id, blockedId: userId },
        ],
      },
    });
    if (blocks.some((block) => block.blockerId === target.id)) {
      // Bloqué par ce motard : même réponse que s'il n'existait pas, pour ne
      // pas révéler le blocage.
      throw new AppException(ErrorCode.FRIEND_HANDLE_NOT_FOUND);
    }
    if (blocks.length > 0) {
      throw new AppException(
        ErrorCode.FRIEND_REQUEST_INVALID,
        "Tu as bloqué ce motard. Débloque-le pour l'ajouter.",
      );
    }

    const key = pairKey(userId, target.id);
    const existing = await this.prisma.friendship.findUnique({ where: { pairKey: key } });
    if (existing !== null) {
      if (existing.acceptedAt !== null) {
        throw new AppException(ErrorCode.FRIEND_ALREADY_CONNECTED, 'Vous êtes déjà amis.');
      }
      if (existing.requesterId === userId) {
        throw new AppException(ErrorCode.FRIEND_ALREADY_CONNECTED, 'Demande déjà envoyée.');
      }
      // Il m'avait déjà demandé : ma demande vaut acceptation.
      await this.prisma.friendship.update({
        where: { id: existing.id },
        data: { acceptedAt: new Date() },
      });
      return this.overview(userId);
    }

    const sentRecently = await this.prisma.friendship.count({
      where: { requesterId: userId, createdAt: { gte: new Date(Date.now() - REQUEST_WINDOW_MS) } },
    });
    if (sentRecently >= DAILY_REQUEST_LIMIT) {
      throw new AppException(ErrorCode.FRIEND_REQUEST_LIMIT);
    }

    try {
      await this.prisma.friendship.create({
        data: { requesterId: userId, addresseeId: target.id, pairKey: key },
      });
    } catch (error) {
      // L'autre a envoyé sa demande au même instant : la base n'en garde
      // qu'une, il reste à l'accepter.
      if (isUniqueConstraintError(error)) {
        throw new AppException(
          ErrorCode.FRIEND_ALREADY_CONNECTED,
          'Une demande est déjà en cours.',
        );
      }
      throw error;
    }
    return this.overview(userId);
  }

  async acceptRequest(userId: UserId, requestId: string): Promise<FriendsOverviewDto> {
    const { count } = await this.prisma.friendship.updateMany({
      where: { id: requestId, addresseeId: userId, acceptedAt: null },
      data: { acceptedAt: new Date() },
    });
    if (count === 0) {
      throw requestNotFound();
    }
    return this.overview(userId);
  }

  // Refuser une demande reçue ou annuler une demande envoyée : dans les deux
  // cas, la demande disparaît sans que l'autre en soit averti.
  async removeRequest(userId: UserId, requestId: string): Promise<FriendsOverviewDto> {
    const { count } = await this.prisma.friendship.deleteMany({
      where: {
        id: requestId,
        acceptedAt: null,
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
    });
    if (count === 0) {
      throw requestNotFound();
    }
    return this.overview(userId);
  }

  async removeFriend(userId: UserId, friendId: string): Promise<FriendsOverviewDto> {
    const { count } = await this.prisma.friendship.deleteMany({
      where: { pairKey: pairKey(userId, friendId), acceptedAt: { not: null } },
    });
    if (count === 0) {
      throw requestNotFound();
    }
    return this.overview(userId);
  }

  // Bloquer efface aussi toute demande ou amitié entre les deux.
  async block(userId: UserId, blockedId: string): Promise<FriendsOverviewDto> {
    if (blockedId === userId) {
      throw new AppException(
        ErrorCode.FRIEND_REQUEST_INVALID,
        'Impossible de te bloquer toi-même.',
      );
    }
    const target = await this.prisma.user.findUnique({
      where: { id: blockedId },
      select: { id: true },
    });
    if (target === null) {
      throw requestNotFound();
    }

    await this.prisma.$transaction([
      this.prisma.friendship.deleteMany({ where: { pairKey: pairKey(userId, blockedId) } }),
      this.prisma.userBlock.upsert({
        where: { blockerId_blockedId: { blockerId: userId, blockedId } },
        create: { blockerId: userId, blockedId },
        update: {},
      }),
    ]);
    return this.overview(userId);
  }

  async unblock(userId: UserId, blockedId: string): Promise<FriendsOverviewDto> {
    const { count } = await this.prisma.userBlock.deleteMany({
      where: { blockerId: userId, blockedId },
    });
    if (count === 0) {
      throw requestNotFound();
    }
    return this.overview(userId);
  }
}
