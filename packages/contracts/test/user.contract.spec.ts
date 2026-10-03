import { describe, expect, it } from 'vitest';

import { setUsernameSchema, updateUserSchema, userSchema } from '../src/user.contract';

const validUser = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  email: 'rider@roadtalk.app',
  firstName: 'Marie',
  lastName: 'Dupont',
  username: null,
  tag: null,
  usernameChangeAllowedAt: null,
  usernameRejectedAt: null,
  createdAt: 0,
  provider: 'google',
};

describe('userSchema', () => {
  it('accepte un utilisateur valide', () => {
    expect(userSchema.safeParse(validUser).success).toBe(true);
  });

  it('rejette un email invalide', () => {
    const result = userSchema.safeParse({ ...validUser, email: 'pas-un-email' });

    expect(result.success).toBe(false);
  });

  it('rejette un prénom vide', () => {
    const result = userSchema.safeParse({ ...validUser, firstName: '' });

    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  it('accepte une mise à jour partielle du prénom seul', () => {
    expect(updateUserSchema.safeParse({ firstName: 'Marie' }).success).toBe(true);
  });

  it('accepte un objet vide (aucun changement)', () => {
    expect(updateUserSchema.safeParse({}).success).toBe(true);
  });

  it("rejette une tentative de modifier l'email via cette route", () => {
    const result = updateUserSchema.safeParse({ email: 'nouveau@roadtalk.app' });

    expect(result.success).toBe(false);
  });
});

describe('setUsernameSchema', () => {
  it('accepte un pseudo valide avec son tag', () => {
    expect(setUsernameSchema.safeParse({ username: 'moto_rider_42', tag: 'BCDF' }).success).toBe(true);
  });

  it('accepte les majuscules : la casse choisie est conservée', () => {
    expect(setUsernameSchema.safeParse({ username: 'MotoRider', tag: 'BCDF' }).success).toBe(true);
  });

  it('rejette un pseudo trop court', () => {
    expect(setUsernameSchema.safeParse({ username: 'ab', tag: 'BCDF' }).success).toBe(false);
  });

  it('rejette un pseudo trop long', () => {
    expect(setUsernameSchema.safeParse({ username: 'a'.repeat(17), tag: 'BCDF' }).success).toBe(false);
  });

  it('rejette les caractères spéciaux et les accents', () => {
    expect(setUsernameSchema.safeParse({ username: 'moto-rider', tag: 'BCDF' }).success).toBe(false);
    expect(setUsernameSchema.safeParse({ username: 'Jérôme', tag: 'BCDF' }).success).toBe(false);
  });

  it('rejette une requête sans tag', () => {
    expect(setUsernameSchema.safeParse({ username: 'MotoRider' }).success).toBe(false);
  });

  it.each(['BCDA', 'bcdf', 'BCD', 'BCDFG', 'BC1F'])('rejette un tag qui ne fait pas 4 consonnes majuscules : %s', (tag) => {
    expect(setUsernameSchema.safeParse({ username: 'MotoRider', tag }).success).toBe(false);
  });
});
