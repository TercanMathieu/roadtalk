import { describe, expect, it } from 'vitest';

import { rideSchema } from '../src/ride.contract';

const ownerId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

const validRide = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  ownerId,
  participantIds: [ownerId],
  status: 'planned',
};

describe('rideSchema', () => {
  it('accepte une balade planifiée minimale', () => {
    expect(rideSchema.safeParse(validRide).success).toBe(true);
  });

  it('rejette une balade sans aucun participant', () => {
    const result = rideSchema.safeParse({ ...validRide, participantIds: [] });

    expect(result.success).toBe(false);
  });

  it('rejette un statut inconnu', () => {
    const result = rideSchema.safeParse({ ...validRide, status: 'paused' });

    expect(result.success).toBe(false);
  });

  it('accepte une balade terminée avec son résumé', () => {
    const completed = {
      ...validRide,
      status: 'completed',
      startedAt: 1_000,
      endedAt: 5_000,
      summary: {
        distanceMeters: 42_000,
        durationSeconds: 3_600,
        averageSpeedMps: 11.6,
        maxSpeedMps: 30,
        elevationGainMeters: 850,
      },
    };

    expect(rideSchema.safeParse(completed).success).toBe(true);
  });
});
