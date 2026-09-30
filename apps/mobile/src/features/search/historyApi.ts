import {
  type AddressHistoryDto,
  addressHistorySchema,
  type AddressSuggestionDto,
} from '@roadtalk/contracts';

import { request } from '../../lib/http';

export async function fetchAddressHistory(accessToken: string): Promise<AddressHistoryDto> {
  const json = await request('GET', '/search-history', { accessToken });

  return addressHistorySchema.parse(json);
}

// Best-effort : appelé juste après une sélection, ne doit jamais empêcher
// celle-ci d'aboutir. L'appelant décide comment (ou si) gérer l'échec.
export async function recordAddressSelection(
  accessToken: string,
  suggestion: AddressSuggestionDto,
): Promise<void> {
  await request('POST', '/search-history', {
    accessToken,
    body: {
      label: suggestion.label,
      context: suggestion.context,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    },
  });
}
