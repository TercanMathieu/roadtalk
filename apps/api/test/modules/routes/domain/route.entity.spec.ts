import {
  createRouteId,
  createUserId,
  degrees,
  meters,
  seconds,
  timestampMs,
} from '@roadtalk/domain-shared';
import { describe, expect, it } from 'vitest';

import {
  createRoute,
  type GeoPoint,
  withComputedMetrics,
} from '../../../../src/modules/routes/domain/route.entity';

const authorId = createUserId();
const routeId = createRouteId();

const paris: GeoPoint = { latitude: degrees(48.8566), longitude: degrees(2.3522) };
const lyon: GeoPoint = { latitude: degrees(45.764), longitude: degrees(4.8357) };

const baseParams = {
  id: routeId,
  authorId,
  waypoints: [paris, lyon],
  routingOptions: { avoidHighways: false, avoidTolls: false },
  source: 'planned' as const,
  createdAt: timestampMs(0),
};

describe('createRoute', () => {
  it('crée un itinéraire valide avec départ et arrivée', () => {
    const result = createRoute(baseParams);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.waypoints).toEqual([paris, lyon]);
      expect(result.value.distanceMeters).toBeUndefined();
    }
  });

  it("refuse un itinéraire avec moins de 2 points (pas d'arrivée)", () => {
    const result = createRoute({ ...baseParams, waypoints: [paris] });

    expect(result).toEqual({ ok: false, error: { type: 'not_enough_waypoints', count: 1 } });
  });

  it('refuse une latitude hors bornes', () => {
    const invalidPoint: GeoPoint = { latitude: degrees(120), longitude: degrees(2) };

    const result = createRoute({ ...baseParams, waypoints: [paris, invalidPoint] });

    expect(result).toEqual({
      ok: false,
      error: { type: 'invalid_coordinates', point: invalidPoint },
    });
  });
});

describe('withComputedMetrics', () => {
  it('attache distance/durée/dénivelé sans modifier le reste', () => {
    const created = createRoute(baseParams);
    if (!created.ok) throw new Error('setup failed');

    const withMetrics = withComputedMetrics(created.value, {
      distanceMeters: meters(465_000),
      durationSeconds: seconds(16_200),
      elevationGainMeters: meters(1_200),
    });

    expect(withMetrics.distanceMeters).toBe(465_000);
    expect(withMetrics.waypoints).toEqual(created.value.waypoints);
  });
});
