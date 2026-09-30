import type { GeoPointDto } from '@roadtalk/contracts';
import { describe, expect, it } from 'vitest';

import { mergeLegPaths } from '../../../src/modules/routing/merge-leg-paths';

const a: GeoPointDto = { latitude: 1, longitude: 1 };
const b: GeoPointDto = { latitude: 2, longitude: 2 };
const c: GeoPointDto = { latitude: 3, longitude: 3 };
const d: GeoPointDto = { latitude: 4, longitude: 4 };

describe('mergeLegPaths', () => {
  it("renvoie le leg tel quel quand il n'y en a qu'un", () => {
    expect(mergeLegPaths([[a, b, c]])).toEqual([a, b, c]);
  });

  // Reproduit ce qu'une vraie réponse Valhalla multi-arrêts renvoie : le
  // dernier point d'un leg est exactement le premier point du suivant
  // (vérifié sur un trajet réel Maisons-Alfort → Drancy → La Rochelle).
  it('retire le point de jonction dupliqué entre deux legs consécutifs', () => {
    const leg1 = [a, b, c]; // c = jonction
    const leg2 = [c, d]; // c répété en tête

    expect(mergeLegPaths([leg1, leg2])).toEqual([a, b, c, d]);
  });

  it('enchaîne trois legs (deux arrêts intermédiaires) sans dupliquer aucune jonction', () => {
    const leg1 = [a, b];
    const leg2 = [b, c];
    const leg3 = [c, d];

    expect(mergeLegPaths([leg1, leg2, leg3])).toEqual([a, b, c, d]);
  });

  it('renvoie un tracé vide pour zéro leg', () => {
    expect(mergeLegPaths([])).toEqual([]);
  });
});
