import { describe, expect, it } from 'vitest';

import { formatSpeedLimitKmh, isOverSpeedLimit } from '../../src/features/routing/format';

const KMH = 1 / 3.6;

describe('formatSpeedLimitKmh', () => {
  it('rend la limitation en km/h entiers', () => {
    expect(formatSpeedLimitKmh(50 * KMH)).toBe('50');
    expect(formatSpeedLimitKmh(130 * KMH)).toBe('130');
  });
});

describe('isOverSpeedLimit', () => {
  it('signale un dépassement dès 1 km/h affiché au-dessus', () => {
    expect(isOverSpeedLimit(51 * KMH, 50 * KMH)).toBe(true);
  });

  it('ne signale rien à la limite ni en dessous', () => {
    expect(isOverSpeedLimit(50 * KMH, 50 * KMH)).toBe(false);
    expect(isOverSpeedLimit(42 * KMH, 50 * KMH)).toBe(false);
  });

  it("ne signale rien quand l'affichage arrondi reste à la limite", () => {
    expect(isOverSpeedLimit(50.4 * KMH, 50 * KMH)).toBe(false);
  });

  it('ne signale rien sans vitesse mesurée ou sans limitation connue', () => {
    expect(isOverSpeedLimit(undefined, 50 * KMH)).toBe(false);
    expect(isOverSpeedLimit(90 * KMH, undefined)).toBe(false);
  });
});
