import 'dotenv/config';

import { generateKeyPairSync } from 'node:crypto';

// Le dépôt ne porte volontairement pas de `.env` (il contient des secrets
// réels, et .gitignore l'exclut). La suite doit pourtant démarrer telle quelle
// sur un clone neuf comme sur un runner CI : on complète ici les variables
// manquantes avec des valeurs jetables, sans jamais écraser celles déjà
// fournies par l'environnement.
function defaultEnv(key: string, build: () => string): void {
  const current = process.env[key];
  if (current === undefined || current === '') {
    process.env[key] = build();
  }
}

let testKeyPair: { publicKey: string; privateKey: string } | undefined;

// Générée à l'exécution plutôt que stockée : aucune clé, même jetable, ne
// traîne dans un dépôt public ni dans les variables du runner.
function keyPair(): { publicKey: string; privateKey: string } {
  testKeyPair ??= generateKeyPairSync('ed25519', {
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return testKeyPair;
}

// Jamais utilisée pour se connecter : les tests d'intégration passent l'URL du
// conteneur Testcontainers directement à PrismaService. Elle n'a besoin d'être
// qu'une URL valide pour franchir la validation Zod au chargement de `env`.
defaultEnv('DATABASE_URL', () => 'postgres://roadtalk:roadtalk@localhost:5432/roadtalk_test');
defaultEnv('JWT_PRIVATE_KEY', () => keyPair().privateKey);
defaultEnv('JWT_PUBLIC_KEY', () => keyPair().publicKey);
