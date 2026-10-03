import { describe, expect, it } from 'vitest';

import { toEpochMs } from '../../src/features/map/epoch';

describe('toEpochMs', () => {
  it('convertit des secondes avec décimales en millisecondes entières (iOS)', () => {
    expect(toEpochMs(1790987506.34145)).toBe(1790987506341);
  });

  it('laisse intactes des millisecondes (Android)', () => {
    expect(toEpochMs(1790987506341)).toBe(1790987506341);
  });

  it('arrondit des millisecondes décimales', () => {
    expect(toEpochMs(1790987506341.6)).toBe(1790987506342);
  });
});
