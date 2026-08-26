import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  // null tant que l'utilisateur n'a pas encore choisi son pseudo.
  username: z.string().nullable(),
  createdAt: z.number().int().nonnegative(),
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

// Minuscules uniquement : évite les doublons "Jean"/"jean" sans colonne de
// normalisation séparée — plus simple que l'unicité insensible à la casse.
export const usernameSchema = z
  .string()
  .min(3)
  .max(20)
  .regex(/^[a-z0-9_]+$/, 'Uniquement minuscules, chiffres et underscore');

export const setUsernameSchema = z
  .object({
    username: usernameSchema,
  })
  .strict();

export type SetUsernameDto = z.infer<typeof setUsernameSchema>;
