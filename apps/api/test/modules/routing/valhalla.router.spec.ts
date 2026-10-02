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

// `maneuvers: []` : forme minimale valide pour les tests qui ne portent pas
// spécifiquement sur le guidage — un leg réel en a toujours au moins une,
// mais le schéma ne l'exige pas (voir routing.contract.ts).
function leg(shape: string): { shape: string; maneuvers: unknown[] } {
  return { shape, maneuvers: [] };
}

describe('ValhallaRouter', () => {
  const router = new ValhallaRouter();

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('convertit la réponse Valhalla en distance/durée/tracé', async () => {
    mockFetchResponse({
      trip: {
        summary: { length: 12.5, time: 900 },
        legs: [leg('e~epoA|jfpOiDaK')],
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

  it('demande le profil "motorcycle" et les instructions en français', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ trip: { summary: { length: 1, time: 1 }, legs: [leg('e~epoA|jfpOiDaK')] } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await router.computeRoute([origin, destination]);

    const [, options] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const body: unknown = JSON.parse(options.body as string);
    expect(body).toMatchObject({ costing: 'motorcycle', language: 'fr-FR' });
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
            legs: [leg('e~epoA|jfpOiDaK'), leg('e~epoA|jfpOiDaK')],
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

  it("n'envoie pas costing_options quand avoidHighways n'est pas demandé", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ trip: { summary: { length: 1, time: 1 }, legs: [leg('e~epoA|jfpOiDaK')] } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await router.computeRoute([origin, destination]);

    const [, options] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const body: unknown = JSON.parse(options.body as string);
    expect(body).not.toHaveProperty('costing_options');
  });

  it('envoie use_highways à 0 quand avoidHighways est demandé', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ trip: { summary: { length: 1, time: 1 }, legs: [leg('e~epoA|jfpOiDaK')] } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await router.computeRoute([origin, destination], true);

    const [, options] = fetchMock.mock.calls[0] as [URL, RequestInit];
    const body: unknown = JSON.parse(options.body as string);
    expect(body).toMatchObject({ costing_options: { motorcycle: { use_highways: 0 } } });
  });

  it('assemble les legs de plusieurs arrêts en un seul tracé continu', async () => {
    // Même vecteur officiel réutilisé deux fois : suffit à prouver que le
    // routeur assemble bien N legs plutôt que de ne lire que legs[0] — la
    // suppression du point de jonction en double est testée précisément
    // dans merge-leg-paths.spec.ts, avec des points de contrôle exacts.
    mockFetchResponse({
      trip: {
        summary: { length: 2, time: 200 },
        legs: [leg('e~epoA|jfpOiDaK'), leg('e~epoA|jfpOiDaK')],
      },
    });

    const result = await router.computeRoute([origin, { latitude: 48.8115, longitude: 2.4392 }, destination]);

    // 2 points par leg, 2 legs, un point de jonction retiré : 3, pas 4.
    expect(result.path).toHaveLength(3);
  });

  describe('manœuvres', () => {
    it("convertit une manœuvre en point absolu à partir de l'index dans le shape de son leg", async () => {
      mockFetchResponse({
        trip: {
          summary: { length: 1, time: 1 },
          legs: [
            {
              shape: 'e~epoA|jfpOiDaK',
              maneuvers: [
                { type: 10, instruction: 'Tournez à droite dans Rue de Lobau.', street_names: ['Rue de Lobau'], begin_shape_index: 1 },
              ],
            },
          ],
        },
      });

      const result = await router.computeRoute([origin, destination]);

      expect(result.maneuvers).toEqual([
        {
          type: 'right',
          instruction: 'Tournez à droite dans Rue de Lobau.',
          streetName: 'Rue de Lobau',
          point: { latitude: 42.225224, longitude: -8.670718 },
        },
      ]);
    });

    it('omet streetName quand Valhalla ne fournit aucun street_names', async () => {
      mockFetchResponse({
        trip: {
          summary: { length: 1, time: 1 },
          legs: [
            {
              shape: 'e~epoA|jfpOiDaK',
              maneuvers: [{ type: 1, instruction: 'Conduisez vers l’est.', begin_shape_index: 0 }],
            },
          ],
        },
      });

      const result = await router.computeRoute([origin, destination]);

      expect(result.maneuvers).toHaveLength(1);
      expect(result.maneuvers[0]).not.toHaveProperty('streetName');
    });

    it('concatène les manœuvres de plusieurs legs, dans l’ordre de parcours', async () => {
      mockFetchResponse({
        trip: {
          summary: { length: 2, time: 200 },
          legs: [
            {
              shape: 'e~epoA|jfpOiDaK',
              maneuvers: [{ type: 1, instruction: 'Premier leg.', begin_shape_index: 0 }],
            },
            {
              shape: 'e~epoA|jfpOiDaK',
              maneuvers: [{ type: 4, instruction: 'Second leg.', begin_shape_index: 1 }],
            },
          ],
        },
      });

      const result = await router.computeRoute([origin, { latitude: 48.8115, longitude: 2.4392 }, destination]);

      expect(result.maneuvers.map((m) => m.instruction)).toEqual(['Premier leg.', 'Second leg.']);
    });

    it("reporte roundabout_exit_count en roundaboutExitNumber sur la manœuvre d'entrée dans un rond-point", async () => {
      mockFetchResponse({
        trip: {
          summary: { length: 1, time: 1 },
          legs: [
            {
              shape: 'e~epoA|jfpOiDaK',
              maneuvers: [
                {
                  type: 26,
                  instruction: 'Entrez dans Place Charles de Gaulle et prenez la 2e sortie dans Avenue de Wagram.',
                  begin_shape_index: 0,
                  roundabout_exit_count: 2,
                },
              ],
            },
          ],
        },
      });

      const result = await router.computeRoute([origin, destination]);

      expect(result.maneuvers[0]).toMatchObject({ type: 'roundabout', roundaboutExitNumber: 2 });
    });

    it("omet roundaboutExitNumber quand Valhalla ne le fournit pas (ex. manœuvre de sortie du rond-point)", async () => {
      mockFetchResponse({
        trip: {
          summary: { length: 1, time: 1 },
          legs: [
            {
              shape: 'e~epoA|jfpOiDaK',
              maneuvers: [{ type: 27, instruction: 'Quittez le rond-point.', begin_shape_index: 0 }],
            },
          ],
        },
      });

      const result = await router.computeRoute([origin, destination]);

      expect(result.maneuvers[0]).not.toHaveProperty('roundaboutExitNumber');
    });

    it('ignore une manœuvre dont begin_shape_index dépasse le shape décodé plutôt que de faire échouer tout le calcul', async () => {
      mockFetchResponse({
        trip: {
          summary: { length: 1, time: 1 },
          legs: [
            {
              shape: 'e~epoA|jfpOiDaK', // 2 points décodés, index valides : 0-1
              maneuvers: [{ type: 1, instruction: 'Index hors bornes.', begin_shape_index: 99 }],
            },
          ],
        },
      });

      const result = await router.computeRoute([origin, destination]);

      expect(result.maneuvers).toEqual([]);
    });
  });
  describe('limitations de vitesse', () => {
    const routeBody = { trip: { summary: { length: 1, time: 1 }, legs: [leg('e~epoA|jfpOiDaK')] } };

    function jsonResponse(body: unknown, ok = true, status = 200): unknown {
      return { ok, status, json: () => Promise.resolve(body) };
    }

    it('joint les limitations renvoyées par /trace_attributes, en m/s', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(routeBody))
        .mockResolvedValueOnce(
          jsonResponse({ edges: [{ begin_shape_index: 0, end_shape_index: 1, speed_limit: 50 }] }),
        );
      vi.stubGlobal('fetch', fetchMock);

      const result = await router.computeRoute([origin, destination]);

      expect(result.speedLimits).toHaveLength(1);
      expect(result.speedLimits[0]).toMatchObject({ startIndex: 0, endIndex: 1 });
      expect(result.speedLimits[0]?.speedLimitMps).toBeCloseTo(13.89, 2);

      const [url, options] = fetchMock.mock.calls[1] as [URL, RequestInit];
      expect(url.pathname).toBe('/trace_attributes');
      expect(JSON.parse(options.body as string)).toMatchObject({
        encoded_polyline: 'e~epoA|jfpOiDaK',
        costing: 'motorcycle',
        shape_match: 'edge_walk',
      });
    });

    it("sert l'itinéraire sans limitations quand /trace_attributes échoue", async () => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValueOnce(jsonResponse(routeBody))
          .mockResolvedValueOnce(jsonResponse({ error_code: 443, error: 'Exact route match algorithm failed' }, false, 400)),
      );

      const result = await router.computeRoute([origin, destination]);

      expect(result.path).toHaveLength(2);
      expect(result.speedLimits).toEqual([]);
    });

    it("sert l'itinéraire sans limitations quand /trace_attributes est injoignable", async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce(jsonResponse(routeBody)).mockRejectedValueOnce(new Error('ECONNREFUSED')),
      );

      const result = await router.computeRoute([origin, destination]);

      expect(result.speedLimits).toEqual([]);
    });
  });
});
