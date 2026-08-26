import { describe, expect, it } from 'vitest';

import {
  appleLoginSchema,
  googleLoginSchema,
  refreshTokenSchema,
  tokenPairSchema,
} from '../src/auth.contract';

describe('appleLoginSchema', () => {
  it('accepte un idToken seul (connexions suivantes, pas de nom renvoyé)', () => {
    expect(appleLoginSchema.safeParse({ idToken: 'a.b.c' }).success).toBe(true);
  });

  it('accepte un idToken avec prénom/nom (première autorisation)', () => {
    const result = appleLoginSchema.safeParse({
      idToken: 'a.b.c',
      firstName: 'Marie',
      lastName: 'Dupont',
    });

    expect(result.success).toBe(true);
  });

  it('rejette un idToken vide', () => {
    expect(appleLoginSchema.safeParse({ idToken: '' }).success).toBe(false);
  });
});

describe('googleLoginSchema', () => {
  it('accepte un idToken', () => {
    expect(googleLoginSchema.safeParse({ idToken: 'a.b.c' }).success).toBe(true);
  });

  it('rejette un body sans idToken', () => {
    expect(googleLoginSchema.safeParse({}).success).toBe(false);
  });
});

describe('refreshTokenSchema', () => {
  it('rejette un refreshToken vide', () => {
    expect(refreshTokenSchema.safeParse({ refreshToken: '' }).success).toBe(false);
  });
});

describe('tokenPairSchema', () => {
  it('accepte une paire de tokens valide', () => {
    const result = tokenPairSchema.safeParse({
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    expect(result.success).toBe(true);
  });
});
