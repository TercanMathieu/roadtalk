import {
  type AddressSearchResultsDto,
  addressSearchResultsSchema,
  type AddressSuggestionDto,
  addressSuggestionSchema,
} from '@roadtalk/contracts';

import { request } from '../../lib/http';
import type { LastKnownPosition } from '../../lib/useLastKnownPosition';

export async function searchAddresses(
  accessToken: string,
  query: string,
  origin: LastKnownPosition | undefined,
): Promise<AddressSearchResultsDto> {
  const params = new URLSearchParams({ q: query });
  if (origin !== undefined) {
    // Classe les résultats en priorité autour de l'utilisateur : « 18 avenue
    // Léon Blum » existe dans des dizaines de communes.
    params.set('latitude', String(origin.latitude));
    params.set('longitude', String(origin.longitude));
  }

  const json = await request('GET', `/search/addresses?${params.toString()}`, { accessToken });

  return addressSearchResultsSchema.parse(json);
}

export async function reverseGeocode(
  accessToken: string,
  point: LastKnownPosition,
): Promise<AddressSuggestionDto> {
  const params = new URLSearchParams({
    latitude: String(point.latitude),
    longitude: String(point.longitude),
  });

  const json = await request('GET', `/search/reverse-geocode?${params.toString()}`, { accessToken });

  return addressSuggestionSchema.parse(json);
}
