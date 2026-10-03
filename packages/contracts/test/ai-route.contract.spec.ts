import { describe, expect, it } from 'vitest';

import { generateAiRouteRequestSchema } from '../src/ai-route.contract';

const base = {
  origin: { latitude: 45.1885, longitude: 5.7245 },
  durationMinutes: 150,
  sinuosity: 'winding',
  roadPreferences: [],
  stopKinds: [],
};

const briancon = { latitude: 44.8986, longitude: 6.6435 };

describe('generateAiRouteRequestSchema', () => {
  it('accepte une arrivée imposée pour un aller simple', () => {
    expect(
      generateAiRouteRequestSchema.safeParse({
        ...base,
        tripType: 'one-way',
        destination: briancon,
      }).success,
    ).toBe(true);
  });

  it('refuse une arrivée pour une boucle, qui revient forcément au départ', () => {
    const result = generateAiRouteRequestSchema.safeParse({
      ...base,
      tripType: 'loop',
      destination: briancon,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['destination']);
  });

  it("laisse l'arrivée facultative", () => {
    expect(generateAiRouteRequestSchema.safeParse({ ...base, tripType: 'one-way' }).success).toBe(
      true,
    );
    expect(generateAiRouteRequestSchema.safeParse({ ...base, tripType: 'loop' }).success).toBe(
      true,
    );
  });
});
