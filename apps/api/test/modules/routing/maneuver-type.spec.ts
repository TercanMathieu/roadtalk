import { describe, expect, it } from 'vitest';

import { mapValhallaManeuverType } from '../../../src/modules/routing/maneuver-type';

describe('mapValhallaManeuverType', () => {
  it.each([
    [1, 'start'],
    [4, 'destination'],
    [6, 'destination'],
    [9, 'slight-right'],
    [10, 'right'],
    [11, 'sharp-right'],
    [12, 'uturn'],
    [13, 'uturn'],
    [14, 'sharp-left'],
    [15, 'left'],
    [16, 'slight-left'],
    [17, 'right'],
    [20, 'right'],
    [24, 'left'],
    [25, 'merge'],
    [26, 'roundabout'],
    [28, 'ferry'],
  ] as const)('code Valhalla %i -> %s (vérifié contre le moteur réel)', (valhallaType, expected) => {
    expect(mapValhallaManeuverType(valhallaType)).toBe(expected);
  });

  it('retombe sur "continue" pour un code non reconnu', () => {
    expect(mapValhallaManeuverType(9999)).toBe('continue');
  });
});
