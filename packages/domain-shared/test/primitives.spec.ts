import { describe, expect, it } from 'vitest';

import { createRideId, createRouteId, createUserId, toUserId } from '../src/ids';
import { err, ok } from '../src/result';
import { meters, metersPerSecond } from '../src/units';

describe('unités', () => {
  it('sont de simples marquages de type : aucune validation au runtime', () => {
    // Documente le contrat volontairement choisi : la validation se fait aux
    // frontières (Zod), pas dans ces constructeurs internes au domaine.
    expect(meters(-5)).toBe(-5);
    expect(metersPerSecond(0)).toBe(0);
  });
});

describe('identifiants', () => {
  it('génère des UUID v4 distincts par type', () => {
    const userId = createUserId();
    const rideId = createRideId();
    const routeId = createRouteId();

    expect(userId).not.toBe(rideId);
    expect(new Set([userId, rideId, routeId]).size).toBe(3);
  });

  it('toUserId marque un UUID déjà validé sans le transformer', () => {
    const raw = createUserId();

    expect(toUserId(raw)).toBe(raw);
  });
});

describe('Result', () => {
  it('distingue ok/err par le discriminant', () => {
    const success = ok(42);
    const failure = err('boom');

    expect(success.ok).toBe(true);
    expect(failure.ok).toBe(false);
  });
});
