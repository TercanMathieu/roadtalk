import { describe, expect, it } from 'vitest';

import { fitRoute } from '../../src/features/map/fit-route';

describe('fitRoute', () => {
  it('centre sur le milieu du trajet', () => {
    const fit = fitRoute(
      [
        { latitude: 43.4, longitude: -1.6 },
        { latitude: 43.5, longitude: -1.4 },
      ],
      320,
      500,
    );

    expect(fit?.center[0]).toBeCloseTo(-1.5, 5);
    expect(fit?.center[1]).toBeCloseTo(43.45, 5);
  });

  it('zoome davantage sur un petit trajet que sur un long', () => {
    const short = fitRoute([{ latitude: 43.48, longitude: -1.55 }, { latitude: 43.49, longitude: -1.5 }], 320, 500);
    const long = fitRoute([{ latitude: 48.85, longitude: 2.35 }, { latitude: 43.5, longitude: -1.45 }], 320, 500);

    expect(short?.zoom).toBeGreaterThan(long?.zoom ?? Infinity);
  });

  it('montre un trajet de ~10 km à un zoom de ville, pas de pays', () => {
    const fit = fitRoute([{ latitude: 43.48, longitude: -1.56 }, { latitude: 43.49, longitude: -1.44 }], 320, 500);

    expect(fit?.zoom).toBeGreaterThan(10);
    expect(fit?.zoom).toBeLessThan(13);
  });

  it('borne le zoom pour un trajet réduit à un point', () => {
    const fit = fitRoute([{ latitude: 43.5, longitude: -1.5 }, { latitude: 43.5, longitude: -1.5 }], 320, 500);

    expect(fit?.zoom).toBe(16);
  });

  it('ne renvoie rien sans trajet', () => {
    expect(fitRoute([], 320, 500)).toBeUndefined();
  });
});
