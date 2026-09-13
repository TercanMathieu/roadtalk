import { ErrorCode } from '@roadtalk/contracts';
import { afterEach, describe, expect, it, type Mock, vi } from 'vitest';

import { type AppErrorBody, AppException } from '../../../src/infrastructure/errors/app-exception';
import { PhotonGeocoder } from '../../../src/modules/search/photon.geocoder';

// Typé sur la signature réellement appelée par le géocodeur : c'est ce qui
// permet de relire l'URL transmise sans cast.
type FetchMock = Mock<(url: URL) => Promise<unknown>>;

function mockPhotonResponse(body: unknown, ok = true, status = 200): FetchMock {
  const fetchMock: FetchMock = vi.fn<(url: URL) => Promise<unknown>>().mockResolvedValue({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
  vi.stubGlobal('fetch', fetchMock);

  return fetchMock;
}

function calledUrl(fetchMock: FetchMock): URL {
  const url = fetchMock.mock.calls[0]?.[0];
  if (url === undefined) {
    expect.unreachable('fetch devait être appelé');
  }

  return url;
}

function feature(properties: Record<string, string>, coordinates = [2.35, 48.86]): unknown {
  return { geometry: { type: 'Point', coordinates }, properties };
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

describe('PhotonGeocoder', () => {
  const geocoder = new PhotonGeocoder();

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('construit le libellé depuis le numéro et la rue, et le contexte depuis la ville', async () => {
    mockPhotonResponse({
      features: [
        feature({
          housenumber: '15',
          street: 'Rue de la Paix',
          postcode: '75002',
          city: 'Paris',
          country: 'France',
        }),
      ],
    });

    const results = await geocoder.searchAddresses('15 rue de la paix', 8);

    expect(results).toEqual([
      {
        label: '15 Rue de la Paix',
        context: '75002, Paris, France',
        latitude: 48.86,
        longitude: 2.35,
      },
    ]);
  });

  it('préfère le nom du lieu quand il existe', async () => {
    mockPhotonResponse({
      features: [feature({ name: 'Hôtel Le Chalet', street: 'Rue de la Paix', city: 'Le Touquet' })],
    });

    const [result] = await geocoder.searchAddresses('hotel le chalet', 8);

    expect(result?.label).toBe('Hôtel Le Chalet');
  });

  it("ne répète pas la ville dans le contexte quand elle sert déjà de libellé", async () => {
    mockPhotonResponse({ features: [feature({ city: 'Lyon', country: 'France' })] });

    const [result] = await geocoder.searchAddresses('lyon', 8);

    expect(result).toMatchObject({ label: 'Lyon', context: 'France' });
  });

  it('renvoie un contexte null quand aucun élément de situation n\'est disponible', async () => {
    mockPhotonResponse({ features: [feature({ name: 'Lieu isolé' })] });

    const [result] = await geocoder.searchAddresses('lieu isole', 8);

    expect(result?.context).toBeNull();
  });

  it('ignore les résultats mal formés sans faire échouer la requête', async () => {
    mockPhotonResponse({
      features: [
        { geometry: { coordinates: 'pas-un-tuple' }, properties: {} },
        feature({ city: 'Nantes' }),
        { properties: { city: 'Sans géométrie' } },
        // Ni nom, ni rue, ni ville : rien à afficher.
        feature({ country: 'France' }),
      ],
    });

    const results = await geocoder.searchAddresses('nantes', 8);

    expect(results).toHaveLength(1);
    expect(results[0]?.label).toBe('Nantes');
  });

  it('transmet la position de l\'utilisateur, arrondie au centième de degré', async () => {
    const fetchMock = mockPhotonResponse({ features: [] });

    await geocoder.searchAddresses('18 avenue leon blum', 8, {
      latitude: 48.858372,
      longitude: 2.294481,
    });

    const url = calledUrl(fetchMock);
    expect(url.searchParams.get('lat')).toBe('48.86');
    expect(url.searchParams.get('lon')).toBe('2.29');
  });

  it("n'envoie aucune coordonnée quand la position est inconnue", async () => {
    const fetchMock = mockPhotonResponse({ features: [] });

    await geocoder.searchAddresses('18 avenue leon blum', 8);

    const url = calledUrl(fetchMock);
    expect(url.searchParams.has('lat')).toBe(false);
    expect(url.searchParams.has('lon')).toBe(false);
  });

  it('lève SEARCH_PROVIDER_UNAVAILABLE quand le géocodeur est injoignable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    await expectErrorCode(
      geocoder.searchAddresses('paris', 8),
      ErrorCode.SEARCH_PROVIDER_UNAVAILABLE,
    );
  });

  it('lève SEARCH_PROVIDER_UNAVAILABLE sur une réponse HTTP en erreur', async () => {
    mockPhotonResponse({}, false, 503);

    await expectErrorCode(
      geocoder.searchAddresses('paris', 8),
      ErrorCode.SEARCH_PROVIDER_UNAVAILABLE,
    );
  });

  it('lève SEARCH_PROVIDER_UNAVAILABLE sur une réponse sans tableau de résultats', async () => {
    mockPhotonResponse({ type: 'FeatureCollection' });

    await expectErrorCode(
      geocoder.searchAddresses('paris', 8),
      ErrorCode.SEARCH_PROVIDER_UNAVAILABLE,
    );
  });
});
