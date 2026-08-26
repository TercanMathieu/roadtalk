import { describe, expect, it } from 'vitest';

import { routeSchema } from '../src/route.contract';

const validRoute = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  authorId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  waypoints: [
    { latitude: 48.8566, longitude: 2.3522 },
    { latitude: 45.764, longitude: 4.8357 },
  ],
  routingOptions: { avoidHighways: false, avoidTolls: false },
  source: 'planned',
  createdAt: 0,
};

describe('routeSchema', () => {
  it('accepte un itinéraire valide', () => {
    expect(routeSchema.safeParse(validRoute).success).toBe(true);
  });

  it('rejette un itinéraire avec un seul point', () => {
    const result = routeSchema.safeParse({ ...validRoute, waypoints: [validRoute.waypoints[0]] });

    expect(result.success).toBe(false);
  });

  it('rejette une latitude hors bornes', () => {
    const result = routeSchema.safeParse({
      ...validRoute,
      waypoints: [{ latitude: 120, longitude: 2 }, validRoute.waypoints[1]],
    });

    expect(result.success).toBe(false);
  });

  it('rejette une distance négative', () => {
    const result = routeSchema.safeParse({ ...validRoute, distanceMeters: -1 });

    expect(result.success).toBe(false);
  });
});
