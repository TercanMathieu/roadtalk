import { z } from 'zod';

// dotenv charge une variable déclarée sans valeur (ex. "APPLE_CLIENT_ID=")
// comme une chaîne vide, pas comme absente — `.optional()` seul ne l'attrape
// pas. On traite explicitement la chaîne vide comme "non configuré".
const optionalNonEmptyString = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().int().positive().default(3000),
  // Requises au démarrage : sans elles, aucune route protégée ne fonctionne.
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  // Optionnelles : seulement nécessaires quand le provider correspondant est
  // réellement utilisé (vérifié à l'usage dans les vérificateurs OAuth, pas ici).
  GOOGLE_OAUTH_CLIENT_ID: optionalNonEmptyString,
  APPLE_CLIENT_ID: optionalNonEmptyString,
});

// Échoue vite et clairement au démarrage si une variable manque, plutôt que
// de planter plus tard sur une erreur de connexion DB peu explicite.
export const env = envSchema.parse(process.env);
