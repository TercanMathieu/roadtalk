import type { AddressSuggestionDto, GenerateAiRouteRequestDto } from '@roadtalk/contracts';
import { describe, expect, it } from 'vitest';

import {
  durationGap,
  durationVerdict,
  knownEnd,
  maxTravelMeters,
  pickWaypointCandidate,
  searchBiasPoint,
} from '../../../src/modules/ai-routes/plan-feasibility';

const grenoble = { latitude: 45.1885, longitude: 5.7245 };
const briancon = { latitude: 44.8986, longitude: 6.6435 };

function place(label: string, latitude: number, longitude: number): AddressSuggestionDto {
  return { label, context: null, latitude, longitude };
}

const baseRequest: GenerateAiRouteRequestDto = {
  origin: grenoble,
  tripType: 'loop',
  durationMinutes: 120,
  sinuosity: 'winding',
  roadPreferences: [],
  stopKinds: [],
};

describe('knownEnd', () => {
  it('termine une boucle au départ, un aller simple à l’arrivée imposée ou nulle part', () => {
    expect(knownEnd(baseRequest)).toEqual(grenoble);
    expect(knownEnd({ ...baseRequest, tripType: 'one-way', destination: briancon })).toEqual(
      briancon,
    );
    expect(knownEnd({ ...baseRequest, tripType: 'one-way' })).toBeUndefined();
  });
});

describe('pickWaypointCandidate', () => {
  const travel = maxTravelMeters(120);

  it("écarte un homonyme à l'autre bout du pays au profit du lieu proche", () => {
    const farHomonym = place('Saint-Pierre', 48.85, -3.0);
    const nearby = place('Saint-Pierre-de-Chartreuse', 45.3436, 5.8136);

    expect(pickWaypointCandidate([farHomonym, nearby], grenoble, grenoble, travel, [])).toEqual(
      nearby,
    );
  });

  it('écarte un lieu confondu avec le départ, l’arrivée ou un point déjà retenu', () => {
    const atStart = place('Grenoble', 45.1886, 5.7246);
    const atEnd = place('Briançon', 44.8987, 6.6436);
    const vizille = place('Vizille', 45.0786, 5.7708);

    expect(pickWaypointCandidate([atStart], grenoble, undefined, travel, [])).toBeUndefined();
    expect(pickWaypointCandidate([atEnd], grenoble, briancon, travel, [])).toBeUndefined();
    expect(pickWaypointCandidate([vizille], grenoble, grenoble, travel, [vizille])).toBeUndefined();
  });

  it('accepte un détour entre départ et arrivée, refuse un lieu qui les éloigne trop', () => {
    const onTheWay = place('Le Bourg-d’Oisans', 45.0556, 6.0306);
    const oppositeDirection = place('Lyon', 45.764, 4.8357);

    expect(pickWaypointCandidate([onTheWay], grenoble, briancon, travel, [])).toEqual(onTheWay);
    expect(
      pickWaypointCandidate([oppositeDirection], grenoble, briancon, travel, []),
    ).toBeUndefined();
  });

  it("une boucle s'éloigne moitié moins qu'un aller simple libre de même durée", () => {
    // ~110 km de Grenoble : hors de portée d'une boucle de 2 h, à portée d'un aller simple.
    const sisteron = place('Sisteron', 44.1956, 5.9439);

    expect(pickWaypointCandidate([sisteron], grenoble, grenoble, travel, [])).toBeUndefined();
    expect(pickWaypointCandidate([sisteron], grenoble, undefined, travel, [])).toEqual(sisteron);
  });
});

describe('searchBiasPoint', () => {
  it('centre la recherche sur le départ, ou sur le milieu du trajet quand l’arrivée est connue', () => {
    expect(searchBiasPoint(grenoble, undefined)).toEqual(grenoble);
    expect(searchBiasPoint(grenoble, briancon).longitude).toBeCloseTo((5.7245 + 6.6435) / 2);
  });
});

describe('durationVerdict', () => {
  it('accepte un écart raisonnable et signale les écarts trop grands', () => {
    expect(durationVerdict(2 * 3_600, 120)).toBe('ok');
    expect(durationVerdict(1.6 * 3_600, 120)).toBe('ok');
    expect(durationVerdict(1 * 3_600, 120)).toBe('too-short');
    expect(durationVerdict(3.5 * 3_600, 120)).toBe('too-long');
  });
});

describe('durationGap', () => {
  it('traite symétriquement le double et la moitié de la cible', () => {
    expect(durationGap(4 * 3_600, 120)).toBeCloseTo(durationGap(1 * 3_600, 120));
    expect(durationGap(2 * 3_600, 120)).toBe(0);
  });
});
