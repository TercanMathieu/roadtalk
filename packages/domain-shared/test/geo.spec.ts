import { describe, expect, it } from 'vitest';

import { distanceBetweenMeters, isValidGeoPoint } from '../src/geo';
import { degrees } from '../src/units';

const point = (latitude: number, longitude: number) => ({
  latitude: degrees(latitude),
  longitude: degrees(longitude),
});

describe('distanceBetweenMeters', () => {
  it('renvoie zéro entre un point et lui-même', () => {
    expect(distanceBetweenMeters(point(48.8566, 2.3522), point(48.8566, 2.3522))).toBe(0);
  });

  // Distance orthodromique Paris–Lyon, ~392 km. Tolérance 0,5 % : c'est l'écart
  // admis du modèle sphérique face à l'ellipsoïde WGS84.
  it('mesure une longue distance connue', () => {
    const paris = point(48.8566, 2.3522);
    const lyon = point(45.764, 4.8357);

    expect(distanceBetweenMeters(paris, lyon)).toBeCloseTo(392_000, -3.5);
  });

  // Un degré de latitude vaut ~111,2 km partout sur le globe.
  it('mesure un degré de latitude', () => {
    expect(distanceBetweenMeters(point(0, 0), point(1, 0))).toBeCloseTo(111_195, -2);
  });

  it('est symétrique', () => {
    const a = point(43.6045, 1.444);
    const b = point(43.61, 1.45);

    expect(distanceBetweenMeters(a, b)).toBeCloseTo(distanceBetweenMeters(b, a), 9);
  });

  // Le cas qui casse une implémentation naïve : acos d'une valeur > 1 par
  // erreur d'arrondi sur deux points quasi confondus renverrait NaN.
  it('reste fini sur deux points quasi confondus', () => {
    const d = distanceBetweenMeters(point(48.8566, 2.3522), point(48.85660001, 2.35220001));

    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeLessThan(1);
  });

  it('traverse l’antiméridien sans exploser', () => {
    expect(distanceBetweenMeters(point(0, 179.9), point(0, -179.9))).toBeLessThan(25_000);
  });
});

describe('isValidGeoPoint', () => {
  it('accepte les bornes', () => {
    expect(isValidGeoPoint(point(90, 180))).toBe(true);
    expect(isValidGeoPoint(point(-90, -180))).toBe(true);
  });

  it('refuse hors bornes', () => {
    expect(isValidGeoPoint(point(90.1, 0))).toBe(false);
    expect(isValidGeoPoint(point(0, 180.1))).toBe(false);
  });
});
