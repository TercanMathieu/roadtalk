import { Injectable } from '@nestjs/common';
import type { AddressSearchResultsDto } from '@roadtalk/contracts';

import { PhotonGeocoder, type SearchOrigin } from './photon.geocoder';

// Assez de choix pour trouver la bonne adresse, assez peu pour rester
// lisible sur un écran de téléphone (C2).
const MAX_RESULTS = 8;

@Injectable()
export class SearchService {
  constructor(private readonly geocoder: PhotonGeocoder) {}

  async searchAddresses(query: string, origin?: SearchOrigin): Promise<AddressSearchResultsDto> {
    return { results: await this.geocoder.searchAddresses(query, MAX_RESULTS, origin) };
  }
}
