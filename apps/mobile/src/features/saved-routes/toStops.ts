import type { AddressSuggestionDto, GeoPointDto } from '@roadtalk/contracts';

// Même arrondi que le libellé de repli utilisé pour un arrêt ajouté par
// appui long sur la carte (voir MapScreen.PLACEHOLDER_LABEL_DECIMALS) : pas
// de géocodage inverse ici (coûteux, un appel par point), le calcul
// d'itinéraire n'en a de toute façon pas besoin.
const PLACEHOLDER_LABEL_DECIMALS = 4;

function toFallbackStop(point: GeoPointDto): AddressSuggestionDto {
  return {
    label: `${point.latitude.toFixed(PLACEHOLDER_LABEL_DECIMALS)}, ${point.longitude.toFixed(
      PLACEHOLDER_LABEL_DECIMALS,
    )}`,
    context: null,
    latitude: point.latitude,
    longitude: point.longitude,
  };
}

// Le premier point d'un itinéraire enregistré était le départ au moment de
// la sauvegarde — jamais réutilisé tel quel : relancer l'itinéraire part de
// la position actuelle, pas de l'ancien point de départ, potentiellement
// obsolète ou éloigné.
export function saveRoutesWaypointsToStops(waypoints: readonly GeoPointDto[]): readonly AddressSuggestionDto[] {
  return waypoints.slice(1).map(toFallbackStop);
}
