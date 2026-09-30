import { describe, expect, it } from 'vitest';

import { decodePolyline6 } from '../../../src/modules/routing/decode-polyline6';

describe('decodePolyline6', () => {
  // Vecteur de test officiel Valhalla (docs/docs/api/decoding.md, exemple Rust) :
  // https://github.com/valhalla/valhalla/blob/master/docs/docs/api/decoding.md
  it('décode le vecteur de référence officiel de Valhalla', () => {
    expect(decodePolyline6('e~epoA|jfpOiDaK')).toEqual([
      { latitude: 42.225139, longitude: -8.670911 },
      { latitude: 42.225224, longitude: -8.670718 },
    ]);
  });

  it('décode une chaîne vide en tracé vide', () => {
    expect(decodePolyline6('')).toEqual([]);
  });

  // Piège de précision : polyline6 (facteur 1e6), pas le polyline5 standard
  // (facteur 1e5) qu'utilisent la plupart des autres services de routage.
  // Confondre les deux décale chaque point d'un facteur 10, silencieusement.
  it('applique la précision 1e6, pas 1e5', () => {
    const [point] = decodePolyline6('e~epoA|jfpOiDaK');
    expect(point?.latitude).toBeCloseTo(42.225139, 6);
    expect(point?.latitude).not.toBeCloseTo(4.2225139, 6);
  });
});
