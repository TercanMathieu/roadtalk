import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  // Identifiant public "Pseudo#TAG" (ADR-003). Les deux sont null tant que
  // l'utilisateur n'a pas rempli sa fiche à la première connexion, et
  // renseignés ensemble ensuite. `username` garde la casse choisie.
  username: z.string().nullable(),
  tag: z.string().nullable(),
  // Date à partir de laquelle l'identifiant pourra de nouveau être modifié
  // (un changement tous les 3 mois). null = modifiable dès maintenant.
  usernameChangeAllowedAt: z.number().int().nonnegative().nullable(),
  // Date à laquelle la modération a retiré l'identifiant précédent : l'app
  // explique alors pourquoi il faut en choisir un nouveau. null sinon.
  usernameRejectedAt: z.number().int().nonnegative().nullable(),
  createdAt: z.number().int().nonnegative(),
  // Dérivé de appleUserId/googleUserId côté serveur — toujours exactement
  // l'un des deux (F1 : OAuth uniquement, voir findOrCreateFromOAuth).
  provider: z.enum(['apple', 'google']),
});

export type UserDto = z.infer<typeof userSchema>;

// .strict() : rejette explicitement les champs non éditables via cette route
// (email, identifiants OAuth) plutôt que de les ignorer silencieusement.
export const updateUserSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
  })
  .strict();

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

// Lettres sans accent, chiffres et underscore. La casse est conservée à
// l'affichage ("Mathieu"), mais l'unicité se juge sans elle côté serveur :
// "Mathieu" et "mathieu" sont le même pseudo.
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 16;

export const usernameSchema = z
  .string()
  .min(USERNAME_MIN_LENGTH)
  .max(USERNAME_MAX_LENGTH)
  .regex(/^[A-Za-z0-9_]+$/, 'Uniquement lettres sans accent, chiffres et underscore');

// Consonnes uniquement : sans voyelle, un tag ne peut pas former un mot, donc
// rien à modérer (ADR-003). Généré par le serveur, jamais saisi librement.
export const TAG_ALPHABET = 'BCDFGHJKLMNPQRSTVWXZ';
export const TAG_LENGTH = 4;

export const tagSchema = z.string().regex(/^[BCDFGHJKLMNPQRSTVWXZ]{4}$/, 'Tag invalide');

// Le tag envoyé est celui proposé par le serveur (handleSuggestionSchema) :
// le client le renvoie tel quel pour confirmer la paire affichée à l'écran.
export const setUsernameSchema = z
  .object({
    username: usernameSchema,
    tag: tagSchema,
  })
  .strict();

export type SetUsernameDto = z.infer<typeof setUsernameSchema>;

export const handleSuggestionQuerySchema = z.object({
  username: usernameSchema,
});

// Réponse à "ce pseudo est-il acceptable ?" : le pseudo tel que saisi et un
// tag libre pour lui. Rien n'est réservé : la paire peut être prise entre la
// suggestion et la confirmation, d'où USERNAME_ALREADY_TAKEN à l'enregistrement.
export const handleSuggestionSchema = z.object({
  username: usernameSchema,
  tag: tagSchema,
});

export type HandleSuggestionDto = z.infer<typeof handleSuggestionSchema>;
