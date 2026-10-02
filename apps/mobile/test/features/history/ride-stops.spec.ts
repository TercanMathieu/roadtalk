import { degrees, meters, timestampMs } from '@roadtalk/domain-shared';
import { describe, expect, it } from 'vitest';

import { detectRideStops } from '../../../src/features/history/ride-stops';
import type { TrackPoint } from '../../../src/features/ride-summary/track-point';

const START = 1_700_000_000_000;

// 0,001° de latitude ≈ 111 m : chaque pas sort largement du rayon d'arrêt.
function point(latitudeSteps: number, atSeconds: number): TrackPoint {
  return {
    position: { latitude: degrees(latitudeSteps * 0.001), longitude: degrees(0) },
    recordedAt: timestampMs(START + atSeconds * 1000),
    speedMps: undefined,
    altitudeMeters: undefined,
    accuracyMeters: meters(5),
  };
}

describe('detectRideStops', () => {
  it('ne trouve aucun arrêt sur un trajet roulé sans pause', () => {
    const track = [point(0, 0), point(1, 10), point(2, 20), point(3, 30)];

    expect(detectRideStops(track)).toEqual([]);
  });

  it('retrouve une pause : un long intervalle avant de repartir du même endroit', () => {
    // Arrivé au point 2 à t=20 s, reparti (point 3) à t=620 s : 10 min sur place.
    const track = [point(0, 0), point(1, 10), point(2, 20), point(3, 620), point(4, 630)];

    const stops = detectRideStops(track);

    expect(stops).toHaveLength(1);
    expect(stops[0]?.position.latitude).toBeCloseTo(0.002, 6);
    expect(stops[0]?.startedAt).toBe(START + 20_000);
    expect(stops[0]?.duration).toBe(600);
  });

  it('ignore une pause trop courte (feu rouge)', () => {
    const track = [point(0, 0), point(1, 10), point(2, 70), point(3, 80)];

    expect(detectRideStops(track)).toEqual([]);
  });

  it("ne compte ni l'attente au départ ni le stationnement à l'arrivée", () => {
    // 10 min avant de partir, puis 10 min sur place une fois arrivé.
    const track = [point(0, 0), point(1, 600), point(2, 610), point(2, 1210)];

    expect(detectRideStops(track)).toEqual([]);
  });

  it('regroupe les points bruités autour du même arrêt', () => {
    const jitter: TrackPoint = {
      ...point(2, 200),
      position: { latitude: degrees(0.0021), longitude: degrees(0) }, // ~11 m du point 2
    };
    const track = [point(0, 0), point(1, 10), point(2, 20), jitter, point(3, 400), point(4, 410)];

    const stops = detectRideStops(track);

    expect(stops).toHaveLength(1);
    expect(stops[0]?.duration).toBe(380);
  });
});
