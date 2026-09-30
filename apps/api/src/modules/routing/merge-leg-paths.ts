import type { GeoPointDto } from '@roadtalk/contracts';

// Vérifié sur une vraie réponse Valhalla à 3 points (Maisons-Alfort → Drancy
// → La Rochelle) : chaque leg partage son point de jonction avec le suivant
// (dernier point du leg N == premier point du leg N+1). Une concaténation
// naïve produirait donc un point dupliqué à chaque arrêt intermédiaire.
export function mergeLegPaths(legPaths: readonly (readonly GeoPointDto[])[]): GeoPointDto[] {
  return legPaths.flatMap((points, index) => (index === 0 ? points : points.slice(1)));
}
