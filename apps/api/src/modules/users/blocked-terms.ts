import type { PrismaClient } from '@prisma/client';

import type { BlockedTerms } from './username-policy';

export type BlockedTermMatch = 'contains' | 'exact';

// Lu à chaque vérification de pseudo plutôt que mis en cache : la table est
// minuscule, les vérifications rares (choix ou changement de pseudo), et un
// terme ajouté par la modération s'applique ainsi immédiatement.
export async function loadBlockedTerms(prisma: PrismaClient): Promise<BlockedTerms> {
  const rows = await prisma.blockedUsernameTerm.findMany({ select: { term: true, match: true } });
  return {
    contains: rows.filter((row) => row.match === 'contains').map((row) => row.term),
    exact: rows.filter((row) => row.match !== 'contains').map((row) => row.term),
  };
}
