import { Injectable } from '@nestjs/common';
import type { AddressSearchResultsDto, AddressSuggestionDto } from '@roadtalk/contracts';

import { PhotonGeocoder, type SearchOrigin } from './photon.geocoder';

// Assez de choix pour trouver la bonne adresse, assez peu pour rester
// lisible sur un écran de téléphone (C2).
const MAX_RESULTS = 8;

// Nombre de décimales affichées quand un point n'a pas de nom exploitable
// (appui en pleine forêt, sur l'eau...) — 4 décimales ≈ 11 m, largement assez
// pour que l'utilisateur reconnaisse l'endroit qu'il a tapé.
const FALLBACK_COORDINATE_DECIMALS = 4;

@Injectable()
export class SearchService {
  constructor(private readonly geocoder: PhotonGeocoder) {}

  async searchAddresses(query: string, origin?: SearchOrigin): Promise<AddressSearchResultsDto> {
    return { results: await this.geocoder.searchAddresses(query, MAX_RESULTS, origin) };
  }

  // Ne renvoie jamais "rien trouvé" : un appui sur la carte doit toujours
  // aboutir à un arrêt ajoutable, même sans nom d'adresse à proposer. Le
  // repli par coordonnées se construit ici, pas dans PhotonGeocoder — le
  // géocodeur reste honnête sur ce qu'il a réellement trouvé, c'est cette
  // couche qui décide de la présentation par défaut.
  async reverseGeocode(point: SearchOrigin): Promise<AddressSuggestionDto> {
    const found = await this.geocoder.reverseGeocode(point);
    if (found !== undefined) {
      return found;
    }

    return {
      label: `${point.latitude.toFixed(FALLBACK_COORDINATE_DECIMALS)}, ${point.longitude.toFixed(FALLBACK_COORDINATE_DECIMALS)}`,
      context: null,
      latitude: point.latitude,
      longitude: point.longitude,
    };
  }
}
