import { describe, expect, it } from 'vitest';

import { friendHandleSchema } from '../src/friends.contract';

describe('friendHandleSchema', () => {
  it('accepte un identifiant Pseudo#TAG, quelle que soit la casse, sans les espaces autour', () => {
    expect(friendHandleSchema.parse(' Mathieu#krtv ')).toBe('Mathieu#krtv');
  });

  it('refuse un identifiant incomplet ou mal formé', () => {
    for (const handle of [
      'Mathieu',
      'Mathieu#',
      '#KRTV',
      'Mathieu#KRT',
      'Ma#KRTV',
      'Mat hieu#KRTV',
      'Mathieu#KR7V',
    ]) {
      expect(friendHandleSchema.safeParse(handle).success).toBe(false);
    }
  });
});
