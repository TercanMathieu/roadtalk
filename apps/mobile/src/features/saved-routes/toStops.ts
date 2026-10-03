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
// la sauvegarde. S'il n'était que la position de l'utilisateur à ce moment-là,
// il n'est jamais réutilisé : relancer part de la position actuelle, pas de
// l'ancien point, potentiellement obsolète ou éloigné.
export function saveRoutesWaypointsToStops(waypoints: readonly GeoPointDto[]): readonly AddressSuggestionDto[] {
  return waypoints.slice(1).map(toFallbackStop);
}

// Départ choisi sur la carte (RouteDto.fixedStart) : lui, est conservé, et
// l'itinéraire repart de ce point.
export function savedRouteOrigin(waypoints: readonly GeoPointDto[]): AddressSuggestionDto | undefined {
  const first = waypoints[0];
  return first !== undefined ? toFallbackStop(first) : undefined;
}
