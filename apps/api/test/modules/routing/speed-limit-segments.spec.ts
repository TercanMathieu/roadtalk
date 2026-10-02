import { describe, expect, it } from 'vitest';

import { buildSpeedLimitSegments } from '../../../src/modules/routing/speed-limit-segments';

describe('buildSpeedLimitSegments', () => {
  it('convertit les km/h en m/s et regroupe les tronçons consécutifs de même limitation', () => {
    const segments = buildSpeedLimitSegments([
      {
        pointCount: 10,
        edges: [
          { beginShapeIndex: 0, endShapeIndex: 3, speedLimitKph: 50 },
          { beginShapeIndex: 3, endShapeIndex: 5, speedLimitKph: 50 },
          { beginShapeIndex: 5, endShapeIndex: 9, speedLimitKph: 80 },
        ],
      },
    ]);

    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ startIndex: 0, endIndex: 5 });
    expect(segments[0]?.speedLimitMps).toBeCloseTo(13.89, 2);
    expect(segments[1]).toMatchObject({ startIndex: 5, endIndex: 9 });
    expect(segments[1]?.speedLimitMps).toBeCloseTo(22.22, 2);
  });

  it('laisse un trou là où la limitation est inconnue, sans la deviner', () => {
    const segments = buildSpeedLimitSegments([
      {
        pointCount: 10,
        edges: [
          { beginShapeIndex: 0, endShapeIndex: 3, speedLimitKph: 50 },
          { beginShapeIndex: 3, endShapeIndex: 6, speedLimitKph: undefined },
          { beginShapeIndex: 6, endShapeIndex: 9, speedLimitKph: 50 },
        ],
      },
    ]);

    expect(segments.map((segment) => [segment.startIndex, segment.endIndex])).toEqual([
      [0, 3],
      [6, 9],
    ]);
  });

  it('décale les index des legs suivants comme la fusion du tracé (point de jonction partagé)', () => {
    const segments = buildSpeedLimitSegments([
      { pointCount: 4, edges: [{ beginShapeIndex: 0, endShapeIndex: 3, speedLimitKph: 50 }] },
      { pointCount: 5, edges: [{ beginShapeIndex: 0, endShapeIndex: 4, speedLimitKph: 80 }] },
    ]);

    // Leg 1 : points 0..3 du tracé fusionné. Leg 2 : son point 0 est le
    // point 3 du tracé fusionné, donc points 3..7.
    expect(segments.map((segment) => [segment.startIndex, segment.endIndex])).toEqual([
      [0, 3],
      [3, 7],
    ]);
  });

  it("ignore la valeur sentinelle « pas de limitation »", () => {
    const segments = buildSpeedLimitSegments([
      { pointCount: 3, edges: [{ beginShapeIndex: 0, endShapeIndex: 2, speedLimitKph: 255 }] },
    ]);

    expect(segments).toEqual([]);
  });
});
