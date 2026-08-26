import {
  createRideId,
  createUserId,
  meters,
  metersPerSecond,
  seconds,
  timestampMs,
} from '@roadtalk/domain-shared';
import { describe, expect, it } from 'vitest';

import {
  cancelRide,
  completeRide,
  planRide,
  type RideSummary,
  startRide,
} from '../../../../src/modules/rides/domain/ride.entity';

const ownerId = createUserId();
const rideId = createRideId();

const summary: RideSummary = {
  distanceMeters: meters(42_000),
  durationSeconds: seconds(3_600),
  averageSpeedMps: metersPerSecond(11.6),
  maxSpeedMps: metersPerSecond(30),
  elevationGainMeters: meters(850),
};

describe('planRide', () => {
  it('crée une balade planifiée avec le créateur comme unique participant', () => {
    const ride = planRide({ id: rideId, ownerId });

    expect(ride.status).toBe('planned');
    expect(ride.participantIds).toEqual([ownerId]);
  });
});

describe('startRide', () => {
  it('démarre une balade planifiée', () => {
    const planned = planRide({ id: rideId, ownerId });

    const result = startRide(planned, timestampMs(1_000));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('active');
      expect(result.value.startedAt).toBe(1_000);
    }
  });

  it('refuse de démarrer une balade déjà active', () => {
    const planned = planRide({ id: rideId, ownerId });
    const started = startRide(planned, timestampMs(1_000));
    if (!started.ok) throw new Error('setup failed');

    const result = startRide(started.value, timestampMs(2_000));

    expect(result).toEqual({
      ok: false,
      error: { type: 'invalid_status', from: 'active', expected: 'planned' },
    });
  });
});

describe('completeRide', () => {
  it('termine une balade active avec un résumé', () => {
    const planned = planRide({ id: rideId, ownerId });
    const started = startRide(planned, timestampMs(1_000));
    if (!started.ok) throw new Error('setup failed');

    const result = completeRide(started.value, summary, timestampMs(5_000));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.summary).toEqual(summary);
      expect(result.value.endedAt).toBe(5_000);
    }
  });

  it("refuse de terminer une balade qui n'a jamais démarré", () => {
    const planned = planRide({ id: rideId, ownerId });

    const result = completeRide(planned, summary, timestampMs(5_000));

    expect(result).toEqual({
      ok: false,
      error: { type: 'invalid_status', from: 'planned', expected: 'active' },
    });
  });

  it('refuse une fin antérieure au départ', () => {
    const planned = planRide({ id: rideId, ownerId });
    const started = startRide(planned, timestampMs(5_000));
    if (!started.ok) throw new Error('setup failed');

    const result = completeRide(started.value, summary, timestampMs(1_000));

    expect(result).toEqual({ ok: false, error: { type: 'end_before_start' } });
  });
});

describe('cancelRide', () => {
  it('annule une balade planifiée', () => {
    const planned = planRide({ id: rideId, ownerId });

    const result = cancelRide(planned);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe('cancelled');
    }
  });

  it('refuse d’annuler une balade déjà terminée', () => {
    const planned = planRide({ id: rideId, ownerId });
    const started = startRide(planned, timestampMs(1_000));
    if (!started.ok) throw new Error('setup failed');
    const completed = completeRide(started.value, summary, timestampMs(5_000));
    if (!completed.ok) throw new Error('setup failed');

    const result = cancelRide(completed.value);

    expect(result).toEqual({
      ok: false,
      error: { type: 'invalid_status', from: 'completed', expected: 'planned' },
    });
  });
});
