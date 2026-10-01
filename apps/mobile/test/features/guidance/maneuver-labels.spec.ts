import type { ManeuverDto } from '@roadtalk/contracts';
import { describe, expect, it } from 'vitest';

import { getManeuverLabel } from '../../../src/features/guidance/maneuver-labels';

const point = { latitude: 0, longitude: 0 };

describe('getManeuverLabel', () => {
  it('indique le numéro de sortie sur la manœuvre d’entrée dans un rond-point', () => {
    const maneuver: ManeuverDto = {
      type: 'roundabout',
      instruction: 'Entrez dans Place Charles de Gaulle et prenez la 2e sortie.',
      roundaboutExitNumber: 2,
      point,
    };

    expect(getManeuverLabel(maneuver)).toBe('Au rond-point, prenez la 2e sortie');
  });

  it('utilise l’ordinal "1re", pas "1e", pour la première sortie', () => {
    const maneuver: ManeuverDto = {
      type: 'roundabout',
      instruction: 'Prenez la 1re sortie.',
      roundaboutExitNumber: 1,
      point,
    };

    expect(getManeuverLabel(maneuver)).toBe('Au rond-point, prenez la 1re sortie');
  });

  it('retombe sur le texte générique de sortie de rond-point sans numéro', () => {
    const maneuver: ManeuverDto = {
      type: 'roundabout',
      instruction: 'Quittez le rond-point.',
      point,
    };

    expect(getManeuverLabel(maneuver)).toBe('Sortez du rond-point');
  });

  it('retombe sur le libellé générique pour les autres types de manœuvre', () => {
    const maneuver: ManeuverDto = {
      type: 'right',
      instruction: 'Tournez à droite dans Rue de Lobau.',
      point,
    };

    expect(getManeuverLabel(maneuver)).toBe('Tournez à droite');
  });
});
