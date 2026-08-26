import { z } from 'zod';

export const appleLoginSchema = z.object({
  idToken: z.string().min(1),
  // Apple ne renvoie le nom qu'à la toute première autorisation, côté client
  // (SDK natif) — jamais dans l'ID token lui-même. Absent aux connexions
  // suivantes : le service garde le nom déjà connu en base.
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
});

export type AppleLoginDto = z.infer<typeof appleLoginSchema>;

export const googleLoginSchema = z.object({
  idToken: z.string().min(1),
});

export type GoogleLoginDto = z.infer<typeof googleLoginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;

export const tokenPairSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export type TokenPairDto = z.infer<typeof tokenPairSchema>;
