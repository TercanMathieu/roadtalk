import type { PrismaClient } from '@prisma/client';

import { type BlockedTermMatch } from './blocked-terms';
import { normalizeBlockedTerm } from './username-policy';

export interface RecentHandle {
  readonly id: string;
  readonly handle: string;
  readonly email: string;
  // Dernier choix ou changement de pseudo, sinon la création du compte.
  readonly since: Date;
}

export interface BlockedTermEntry {
  readonly term: string;
  readonly match: BlockedTermMatch;
  readonly createdAt: Date;
}

// Outils de modération des pseudos, utilisés depuis le script
// `pnpm moderation` (scripts/moderation.ts) — pas d'interface
// d'administration en V1 : un seul modérateur, le développeur (C6).
// Volontairement hors de Nest et sans route HTTP : rien de tout ceci ne doit
// être joignable depuis l'API publique.
export class UsernameModerationService {
  constructor(private readonly prisma: PrismaClient) {}

  // Pseudos choisis ou modifiés récemment, pour une relecture régulière.
  async listRecentHandles(sinceDays: number): Promise<readonly RecentHandle[]> {
    const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.user.findMany({
      where: {
        username: { not: null },
        OR: [{ usernameChangedAt: { gte: since } }, { usernameChangedAt: null, createdAt: { gte: since } }],
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, tag: true, email: true, createdAt: true, usernameChangedAt: true },
    });

    return rows.map((row) => ({
      id: row.id,
      handle: `${row.username ?? ''}#${row.tag ?? ''}`,
      email: row.email,
      since: row.usernameChangedAt ?? row.createdAt,
    }));
  }

  // Retire l'identifiant "Pseudo#TAG" d'un compte : l'utilisateur devra en
  // choisir un autre à sa prochaine ouverture de l'app, sans attendre le
  // délai de 3 mois. Le pseudo retiré est ajouté aux termes bloqués, pour
  // qu'il ne puisse pas le reprendre avec un autre tag.
  // Renvoie false si aucun compte ne porte cet identifiant.
  async rejectHandle(username: string, tag: string): Promise<boolean> {
    const usernameKey = username.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { usernameKey_tag: { usernameKey, tag: tag.toUpperCase() } },
    });
    if (user === null) {
      return false;
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          username: null,
          usernameKey: null,
          tag: null,
          usernameChangedAt: null,
          usernameRejectedAt: new Date(),
        },
      }),
      this.prisma.blockedUsernameTerm.upsert({
        where: { term: normalizeBlockedTerm(username) },
        create: { term: normalizeBlockedTerm(username), match: 'exact' },
        update: {},
      }),
    ]);
    return true;
  }

  // Ajoute un terme au filtre. Ne touche pas aux comptes qui l'utilisent
  // déjà : chacun se traite avec rejectHandle, après relecture.
  async blockTerm(term: string, match: BlockedTermMatch): Promise<string> {
    const normalized = normalizeBlockedTerm(term);
    await this.prisma.blockedUsernameTerm.upsert({
      where: { term: normalized },
      create: { term: normalized, match },
      update: { match },
    });
    return normalized;
  }

  async unblockTerm(term: string): Promise<boolean> {
    const { count } = await this.prisma.blockedUsernameTerm.deleteMany({
      where: { term: normalizeBlockedTerm(term) },
    });
    return count > 0;
  }

  async listBlockedTerms(): Promise<readonly BlockedTermEntry[]> {
    const rows = await this.prisma.blockedUsernameTerm.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map((row) => ({
      term: row.term,
      match: row.match === 'contains' ? 'contains' : 'exact',
      createdAt: row.createdAt,
    }));
  }
}
