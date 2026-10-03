import type { ManeuverDto } from '@roadtalk/contracts';
import { describe, expect, it } from 'vitest';

import {
  type AnnouncementState,
  decideAnnouncement,
  decideStatusAnnouncement,
  INITIAL_ANNOUNCEMENT_STATE,
  spokenAction,
  spokenDistance,
} from '../../../src/features/guidance/voice-announcements';

const point = { latitude: 0, longitude: 0 };
const right: ManeuverDto = { type: 'right', instruction: '', point };
const left: ManeuverDto = { type: 'left', instruction: '', point };
const roundabout: ManeuverDto = { type: 'roundabout', instruction: '', roundaboutExitNumber: 2, point };
const destination: ManeuverDto = { type: 'destination', instruction: '', point };

function announce(
  distanceMeters: number,
  state: AnnouncementState = INITIAL_ANNOUNCEMENT_STATE,
  overrides: Partial<Parameters<typeof decideAnnouncement>[0]> = {},
): ReturnType<typeof decideAnnouncement> {
  return decideAnnouncement(
    { maneuverIndex: 3, maneuver: right, thenManeuver: undefined, distanceMeters, speedMps: 14, ...overrides },
    state,
  );
}

describe('spokenDistance', () => {
  it.each([
    [283, '300 mètres'],
    [120, '120 mètres'],
    [97, '100 mètres'],
    [5, '10 mètres'],
    [1000, '1 kilomètre'],
    [1480, '1,5 kilomètre'],
    [2100, '2 kilomètres'],
    [2900, '3 kilomètres'],
  ])("dit %d m comme '%s'", (meters, expected) => {
    expect(spokenDistance(meters)).toBe(expected);
  });
});

describe('spokenAction', () => {
  it('donne le numéro de sortie au rond-point', () => {
    expect(spokenAction(roundabout)).toBe('au rond-point, prenez la 2e sortie');
  });

  it('distingue les degrés de virage', () => {
    expect(spokenAction({ ...right, type: 'slight-right' })).toBe('tournez légèrement à droite');
    expect(spokenAction({ ...left, type: 'sharp-left' })).toBe('tournez fortement à gauche');
  });
});

describe('decideAnnouncement', () => {
  it('se tait loin de la manœuvre', () => {
    expect(announce(2000).text).toBeUndefined();
  });

  it('annonce de loin avec la distance', () => {
    expect(announce(400).text).toBe('Dans 400 mètres, tournez à droite.');
  });

  it("n'annonce qu'une fois de loin", () => {
    const first = announce(400);
    const second = announce(380, first.state);

    expect(second.text).toBeUndefined();
  });

  it('annonce juste avant, sans distance', () => {
    const far = announce(400);
    const near = announce(100, far.state);

    expect(near.text).toBe('Tournez à droite.');
  });

  it("ne parle pas deux fois de près pour la même manœuvre", () => {
    const near = announce(100);

    expect(announce(80, near.state).text).toBeUndefined();
  });

  it("saute l'annonce de loin quand la manœuvre est déjà proche", () => {
    // Première vue de la manœuvre à 100 m : une seule phrase, la proche.
    const result = announce(100);

    expect(result.text).toBe('Tournez à droite.');
    expect(announce(90, result.state).text).toBeUndefined();
  });

  it('ajoute la manœuvre enchaînée', () => {
    expect(announce(100, INITIAL_ANNOUNCEMENT_STATE, { thenManeuver: left }).text).toBe(
      'Tournez à droite. Puis tournez à gauche.',
    );
  });

  it("repart à zéro quand la manœuvre suivante prend le relais", () => {
    const first = announce(100);

    const next = announce(400, first.state, { maneuverIndex: 4, maneuver: left });

    expect(next.text).toBe('Dans 400 mètres, tournez à gauche.');
  });

  it('annonce plus tôt quand on roule vite', () => {
    // 130 km/h : l'annonce de loin part à ~1 km, pas à 250 m.
    expect(announce(1000, INITIAL_ANNOUNCEMENT_STATE, { speedMps: 36 }).text).toBe(
      'Dans 1 kilomètre, tournez à droite.',
    );
    expect(announce(1000, INITIAL_ANNOUNCEMENT_STATE, { speedMps: 8 }).text).toBeUndefined();
  });

  it('annonce le rond-point avec son numéro de sortie', () => {
    expect(announce(100, INITIAL_ANNOUNCEMENT_STATE, { maneuver: roundabout }).text).toBe(
      'Au rond-point, prenez la 2e sortie.',
    );
  });

  it("annonce l'arrivée une fois", () => {
    const arrival = announce(20, INITIAL_ANNOUNCEMENT_STATE, { maneuver: destination });

    expect(arrival.text).toBe('Vous êtes arrivé.');
    expect(announce(10, arrival.state, { maneuver: destination }).text).toBeUndefined();
  });

  it('ne dit rien pour continuer tout droit ni pour le départ', () => {
    expect(announce(100, INITIAL_ANNOUNCEMENT_STATE, { maneuver: { ...right, type: 'continue' } }).text).toBeUndefined();
    expect(announce(100, INITIAL_ANNOUNCEMENT_STATE, { maneuver: { ...right, type: 'start' } }).text).toBeUndefined();
  });
});

describe('decideStatusAnnouncement', () => {
  it("prévient en quittant l'itinéraire, une seule fois", () => {
    expect(decideStatusAnnouncement('on-route', 'off-route')).toBe("Vous avez quitté l'itinéraire. Recalcul en cours.");
    expect(decideStatusAnnouncement('off-route', 'rerouting')).toBeUndefined();
  });

  it('prévient quand le nouveau tracé est prêt', () => {
    expect(decideStatusAnnouncement('rerouting', 'on-route')).toBe('Nouvel itinéraire.');
  });

  it("ne dit rien tant que rien ne change", () => {
    expect(decideStatusAnnouncement('on-route', 'on-route')).toBeUndefined();
  });
});
