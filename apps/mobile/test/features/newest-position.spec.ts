import { describe, expect, it } from 'vitest';

import { newestPosition } from '../../src/features/map/newest-position';

const at = (recordedAt: number): { latitude: number; longitude: number; speedMps: number; recordedAt: number } => ({
  latitude: 48,
  longitude: 2,
  speedMps: 10,
  recordedAt,
});

describe('newestPosition', () => {
  it("garde la plus récente des deux sources", () => {
    expect(newestPosition(at(100), at(200))).toEqual(at(200));
    expect(newestPosition(at(300), at(200))).toEqual(at(300));
  });

  it("prend la première à égalité (celle de la carte)", () => {
    const first = { ...at(100), headingDeg: 90 };

    expect(newestPosition(first, at(100))).toBe(first);
  });

  it("se rabat sur l'unique source disponible", () => {
    expect(newestPosition(undefined, at(100))).toEqual(at(100));
    expect(newestPosition(at(100), undefined)).toEqual(at(100));
    expect(newestPosition(undefined, undefined)).toBeUndefined();
  });
});
