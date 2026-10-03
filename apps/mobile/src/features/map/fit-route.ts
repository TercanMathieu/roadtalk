import type { GeoPointDto } from '@roadtalk/contracts';

export interface RouteFit {
  readonly center: [number, number];
  readonly zoom: number;
}

const TILE_SIZE_PX = 512;
const MAX_ZOOM = 16;
const MIN_ZOOM = 3;

// Centre et zoom qui montrent tout le trajet dans la zone visible de la carte
// (largeur et hauteur en points, une fois les marges retirées). Calculé ici
// plutôt que confié à `fitBounds` : même résultat attendu, mais le centre et
// le zoom sont connus et testables.
export function fitRoute(path: readonly GeoPointDto[], visibleWidth: number, visibleHeight: number): RouteFit | undefined {
  if (path.length === 0) {
    return undefined;
  }

  let west = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;
  for (const point of path) {
    west = Math.min(west, point.longitude);
    east = Math.max(east, point.longitude);
    south = Math.min(south, point.latitude);
    north = Math.max(north, point.latitude);
  }

  const centerLng = (west + east) / 2;
  const centerLat = (south + north) / 2;
  const lngSpan = Math.max(east - west, 1e-5);
  // Le zoom Web Mercator étire les latitudes : un degré de latitude occupe
  // 1/cos(lat) de plus qu'à l'équateur.
  const latSpanProjected = Math.max((north - south) / Math.cos((centerLat * Math.PI) / 180), 1e-5);

  const zoomForWidth = Math.log2((360 * visibleWidth) / (TILE_SIZE_PX * lngSpan));
  const zoomForHeight = Math.log2((360 * visibleHeight) / (TILE_SIZE_PX * latSpanProjected));
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.min(zoomForWidth, zoomForHeight)));

  return { center: [centerLng, centerLat], zoom };
}
