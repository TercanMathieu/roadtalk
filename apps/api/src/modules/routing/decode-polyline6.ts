import type { GeoPointDto } from '@roadtalk/contracts';

// Valhalla encode la géométrie de trajet en "polyline6" : l'algorithme de
// polyligne de Google, mais avec une précision de 6 décimales (facteur 1e6)
// plutôt que les 5 décimales usuelles (facteur 1e5) qu'utilisent la plupart
// des autres services. Confondre les deux précisions décale chaque point
// d'un facteur 10 — silencieusement, sans erreur, juste une carte fausse.
// Vérifié dans la documentation officielle Valhalla avant d'écrire ce code :
// https://valhalla.github.io/valhalla/decoding/
const POLYLINE6_PRECISION = 1e6;

export function decodePolyline6(encoded: string): GeoPointDto[] {
  const points: GeoPointDto[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;

  while (index < encoded.length) {
    latitude += decodeSignedValue();
    longitude += decodeSignedValue();
    points.push({ latitude: latitude / POLYLINE6_PRECISION, longitude: longitude / POLYLINE6_PRECISION });
  }

  return points;

  // Chaque coordonnée est un delta par rapport à la précédente, encodé en
  // base64 modifiée (5 bits utiles par caractère, bit de poids fort = "encore
  // un caractère à lire"), puis zigzag pour représenter les deltas négatifs.
  function decodeSignedValue(): number {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    return result & 1 ? ~(result >> 1) : result >> 1;
  }
}
