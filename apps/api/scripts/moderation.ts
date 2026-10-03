import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

import { UsernameModerationService } from '../src/modules/users/username-moderation.service';

const USAGE = `Modération des pseudos RoadTalk

  pnpm moderation recent [jours]        pseudos choisis ou modifiés récemment (7 jours par défaut)
  pnpm moderation reject <Pseudo#TAG>   retire un identifiant et bloque ce pseudo
  pnpm moderation block <terme>         interdit un terme comme pseudo ou morceau isolé
  pnpm moderation block <terme> --contains
                                        interdit un terme même au milieu d'un pseudo
  pnpm moderation unblock <terme>       retire un terme ajouté
  pnpm moderation blocked               termes ajoutés par la modération
`;

const DEFAULT_RECENT_DAYS = 7;

async function run(service: UsernameModerationService, args: readonly string[]): Promise<number> {
  const [command, argument, option] = args;

  switch (command) {
    case 'recent': {
      const days = argument !== undefined ? Number(argument) : DEFAULT_RECENT_DAYS;
      if (!Number.isInteger(days) || days <= 0) {
        console.error('Le nombre de jours doit être un entier positif.');
        return 1;
      }
      const handles = await service.listRecentHandles(days);
      if (handles.length === 0) {
        console.log(`Aucun pseudo choisi ou modifié ces ${String(days)} derniers jours.`);
        return 0;
      }
      for (const entry of handles) {
        console.log(`${entry.since.toISOString().slice(0, 10)}  ${entry.handle.padEnd(24)} ${entry.email}`);
      }
      return 0;
    }

    case 'reject': {
      const match = argument !== undefined ? /^([A-Za-z0-9_]+)#([A-Za-z]{4})$/.exec(argument) : null;
      const [, username, tag] = match ?? [];
      if (username === undefined || tag === undefined) {
        console.error('Identifiant attendu au format Pseudo#TAG.');
        return 1;
      }
      const rejected = await service.rejectHandle(username, tag);
      console.log(
        rejected
          ? `${argument ?? ''} retiré. L'utilisateur devra choisir un nouveau pseudo ; "${username}" est bloqué.`
          : `Aucun compte ne porte l'identifiant ${argument ?? ''}.`,
      );
      return rejected ? 0 : 1;
    }

    case 'block': {
      if (argument === undefined || argument.length === 0) {
        console.error('Terme attendu.');
        return 1;
      }
      const term = await service.blockTerm(argument, option === '--contains' ? 'contains' : 'exact');
      console.log(`"${term}" bloqué (${option === '--contains' ? 'même au milieu' : 'pseudo ou morceau isolé'}).`);
      return 0;
    }

    case 'unblock': {
      if (argument === undefined) {
        console.error('Terme attendu.');
        return 1;
      }
      const removed = await service.unblockTerm(argument);
      console.log(removed ? `"${argument}" n'est plus bloqué.` : `"${argument}" n'était pas dans la liste.`);
      return removed ? 0 : 1;
    }

    case 'blocked': {
      const terms = await service.listBlockedTerms();
      if (terms.length === 0) {
        console.log('Aucun terme ajouté par la modération.');
      }
      for (const entry of terms) {
        console.log(`${entry.createdAt.toISOString().slice(0, 10)}  ${entry.term.padEnd(24)} ${entry.match}`);
      }
      return 0;
    }

    default:
      console.log(USAGE);
      return command === undefined || command === 'help' ? 0 : 1;
  }
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    process.exitCode = await run(new UsernameModerationService(prisma), process.argv.slice(2));
  } finally {
    await prisma.$disconnect();
  }
}

void main();
