import type { GeoPointDto } from '@roadtalk/contracts';
import { ErrorCode } from '@roadtalk/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type AppErrorBody, AppException } from '../../../src/infrastructure/errors/app-exception';
import { ValhallaRouter } from '../../../src/modules/routing/valhalla.router';

function mockFetchResponse(body: unknown, ok = true, status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: () => Promise.resolve(body),
    }),
  );
}

async function expectErrorCode(promise: Promise<unknown>, code: ErrorCode): Promise<void> {
  try {
    await promise;
    expect.unreachable(`devait rejeter avec le code ${code}`);
  } catch (error) {
    expect(error).toBeInstanceOf(AppException);
    expect(((error as AppException).getResponse() as AppErrorBody).code).toBe(code);
  }
}

// Point de départ/arrivée arbitraires — non utilisés pour leur géographie,
// seulement pour peupler la requête.
const origin: GeoPointDto = { latitude: 48.8566, longitude: 2.3522 };
const destination: GeoPointDto = { latitude: 45.764, longitude: 4.8357 };

describe('ValhallaRouter', () => {
  const router = new ValhallaRouter();

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('convertit la réponse Valhalla en distance/durée/tracé', async () => {
    mockFetchResponse({
      trip: {
        summary: { length: 12.5, time: 900 },
        legs: [{ shape: 'e~epoA|jfpOiDaK' }],
      },
    });

    const result = await router.computeRoute([origin, destination]);

    expect(result.distanceMeters).toBe(12_500);
    expect(result.durationSeconds).toBe(900);
    expect(result.path).toEqual([
      { latitude: 42.225139, longitude: -8.670911 },
      { latitude: 42.225224, longitude: -8.670718 },
    ]);
  });

  it('demande le profil "motorcycle", pas "auto"', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({ trip: { summary: { length: 1, time: 1 }, legs: [{ shape: 'e~epoA|jfpOiDaK' }] } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await router.computeRoute([origin, destination]);

    const [, options] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const body: unknown = JSON.parse(options.body as string);
    expect(body).toMatchObject({ costing: 'motorcycle' });
  });

  it('lève ROUTE_NOT_FOUND quand Valhalla renvoie le code interne 442', async () => {
    mockFetchResponse({ error_code: 442, error: 'No path could be found for input' }, false, 400);

    await expectErrorCode(router.computeRoute([origin, destination]), ErrorCode.ROUTE_NOT_FOUND);
  });

  it("lève ROUTING_PROVIDER_UNAVAILABLE sur un 400 qui n'est pas le code 442", async () => {
    mockFetchResponse({ error_code: 154, error: 'No costing method found' }, false, 400);

    await expectErrorCode(router.computeRoute([origin, destination]), ErrorCode.ROUTING_PROVIDER_UNAVAILABLE);
  });

  it('lève ROUTING_PROVIDER_UNAVAILABLE quand le moteur est injoignable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    await expectErrorCode(router.computeRoute([origin, destination]), ErrorCode.ROUTING_PROVIDER_UNAVAILABLE);
  });

  it('lève ROUTING_PROVIDER_UNAVAILABLE sur une réponse 200 non conforme', async () => {
    mockFetchResponse({ trip: { summary: { length: 1 } } });

    await expectErrorCode(router.computeRoute([origin, destination]), ErrorCode.ROUTING_PROVIDER_UNAVAILABLE);
  });

  it('envoie un arrêt intermédiaire comme point "break" à Valhalla', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          trip: {
            summary: { length: 1, time: 1 },
            legs: [{ shape: 'e~epoA|jfpOiDaK' }, { shape: 'e~epoA|jfpOiDaK' }],
          },
        }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const stop: GeoPointDto = { latitude: 48.8115, longitude: 2.4392 };
    await router.computeRoute([origin, stop, destination]);

    const [, options] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const body: unknown = JSON.parse(options.body as string);
    expect(body).toMatchObject({
      locations: [
        { lat: origin.latitude, lon: origin.longitude, type: 'break' },
        { lat: stop.latitude, lon: stop.longitude, type: 'break' },
        { lat: destination.latitude, lon: destination.longitude, type: 'break' },
      ],
    });
  });

  it('assemble les legs de plusieurs arrêts en un seul tracé continu', async () => {
    // Même vecteur officiel réutilisé deux fois : suffit à prouver que le
    // routeur assemble bien N legs plutôt que de ne lire que legs[0] — la
    // suppression du point de jonction en double est testée précisément
    // dans merge-leg-paths.spec.ts, avec des points de contrôle exacts.
    mockFetchResponse({
      trip: {
        summary: { length: 2, time: 200 },
        legs: [{ shape: 'e~epoA|jfpOiDaK' }, { shape: 'e~epoA|jfpOiDaK' }],
      },
    });

    const result = await router.computeRoute([origin, { latitude: 48.8115, longitude: 2.4392 }, destination]);

    // 2 points par leg, 2 legs, un point de jonction retiré : 3, pas 4.
    expect(result.path).toHaveLength(3);
  });
});
