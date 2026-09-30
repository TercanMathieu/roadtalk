import { type Degrees, type Meters, meters } from './units';

/**
 * Coordonnée géographique. Partagée entre contextes (un itinéraire a des
 * waypoints, une balade a un tracé) — elle vit donc ici plutôt que dans le
 * domaine de l'un d'eux, qu'ADR-001 interdit à l'autre d'importer.
 */
export interface GeoPoint {
  readonly latitude: Degrees;
  readonly longitude: Degrees;
}

const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

export function isValidGeoPoint(point: GeoPoint): boolean {
  return (
    point.latitude >= MIN_LATITUDE &&
    point.latitude <= MAX_LATITUDE &&
    point.longitude >= MIN_LONGITUDE &&
    point.longitude <= MAX_LONGITUDE
  );
}

// Rayon moyen de la Terre (sphère de référence IUGG).
const EARTH_RADIUS_METERS = 6_371_008.8;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Distance orthodromique entre deux points, formule de haversine.
 *
 * Modèle sphérique : l'écart avec l'ellipsoïde WGS84 reste sous 0,5 %, très
 * en dessous du bruit du GPS lui-même. Une formule ellipsoïdale (Vincenty)
 * n'apporterait ici qu'une fausse précision.
 */
export function distanceBetweenMeters(from: GeoPoint, to: GeoPoint): Meters {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLon = toRadians(to.longitude - from.longitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

  return meters(2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(a))));
}
