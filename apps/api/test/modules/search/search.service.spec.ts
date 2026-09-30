import type { AddressSuggestionDto } from '@roadtalk/contracts';
import { describe, expect, it, vi } from 'vitest';

import type { PhotonGeocoder } from '../../../src/modules/search/photon.geocoder';
import { SearchService } from '../../../src/modules/search/search.service';

function fakeGeocoder(reverseGeocodeResult: AddressSuggestionDto | undefined): PhotonGeocoder {
  return {
    reverseGeocode: vi.fn().mockResolvedValue(reverseGeocodeResult),
  } as unknown as PhotonGeocoder;
}

describe('SearchService.reverseGeocode', () => {
  it('renvoie le lieu trouvé par le géocodeur tel quel', async () => {
    const found: AddressSuggestionDto = {
      label: 'Tour Eiffel',
      context: 'Paris, France',
      latitude: 48.8584,
      longitude: 2.2945,
    };
    const service = new SearchService(fakeGeocoder(found));

    const result = await service.reverseGeocode({ latitude: 48.8584, longitude: 2.2945 });

    expect(result).toEqual(found);
  });

  it('replie sur un libellé de coordonnées quand le géocodeur ne trouve rien', async () => {
    const service = new SearchService(fakeGeocoder(undefined));

    const result = await service.reverseGeocode({ latitude: 48.8566, longitude: 2.3522 });

    expect(result).toEqual({
      label: '48.8566, 2.3522',
      context: null,
      latitude: 48.8566,
      longitude: 2.3522,
    });
  });

  it('arrondit le libellé de repli à 4 décimales sans altérer les coordonnées renvoyées', async () => {
    const service = new SearchService(fakeGeocoder(undefined));

    const result = await service.reverseGeocode({ latitude: 48.85663217, longitude: 2.35221093 });

    expect(result.label).toBe('48.8566, 2.3522');
    expect(result.latitude).toBe(48.85663217);
    expect(result.longitude).toBe(2.35221093);
  });
});
