import type { GeoPointDto, ManeuverDto, RouteGeometryDto } from '@roadtalk/contracts';
import { describe, expect, it } from 'vitest';

import {
  buildRouteProgressModel,
  computeRouteProgress,
  getManeuverSteps,
} from '../../../src/features/guidance/route-progress';

// Ligne droite le long d'un méridien : 1° de latitude ≈ 111 320 m partout,
// aucun facteur de compression par la longitude à gérer — les distances
// attendues se calculent de tête pour vérifier l'algorithme, pas un jeu de
// coordonnées réelles.
const path: GeoPointDto[] = [
  { latitude: 0, longitude: 0 }, // index 0, cumulative 0
  { latitude: 0.001, longitude: 0 }, // index 1, cumulative ≈ 111.2 m
  { latitude: 0.002, longitude: 0 }, // index 2, cumulative ≈ 222.4 m
  { latitude: 0.003, longitude: 0 }, // index 3, cumulative ≈ 333.6 m
  { latitude: 0.004, longitude: 0 }, // index 4, cumulative ≈ 444.8 m
];

const turnRight: ManeuverDto = {
  type: 'right',
  instruction: 'Tournez à droite.',
  point: { latitude: 0.002, longitude: 0 }, // même point que path[2]
};

const arrival: ManeuverDto = {
  type: 'destination',
  instruction: 'Vous êtes arrivé.',
  point: { latitude: 0.004, longitude: 0 }, // même point que path[4]
};

const route: RouteGeometryDto = {
  distanceMeters: 444.8,
  durationSeconds: 60,
  path,
  maneuvers: [turnRight, arrival],
  // 50 km/h de l'index 0 à 2, inconnue de 2 à 3, 80 km/h de 3 à 4.
  speedLimits: [
    { startIndex: 0, endIndex: 2, speedLimitMps: 13.89 },
    { startIndex: 3, endIndex: 4, speedLimitMps: 22.22 },
  ],
};

describe('route-progress', () => {
  it('identifie la première manœuvre comme prochaine quand on est au départ', () => {
    const model = buildRouteProgressModel(route);

    const progress = computeRouteProgress(model, { latitude: 0, longitude: 0 });

    expect(progress.nextManeuver).toEqual(turnRight);
    expect(progress.distanceToNextManeuver).toBeCloseTo(222.4, 0);
    expect(progress.distanceRemaining).toBeCloseTo(444.8, 0);
    expect(progress.distanceFromRoute).toBeCloseTo(0, 1);
    expect(progress.durationRemaining).toBeCloseTo(60, 0);
  });

  it('passe à la manœuvre suivante une fois la précédente atteinte', () => {
    const model = buildRouteProgressModel(route);

    // Exactement au point de la manœuvre "tournez à droite" : elle vient
    // d'être franchie, la prochaine doit être l'arrivée.
    const progress = computeRouteProgress(model, { latitude: 0.002, longitude: 0 });

    expect(progress.nextManeuver).toEqual(arrival);
    expect(progress.distanceToNextManeuver).toBeCloseTo(222.4, 0);
  });

  it('retrouve le point le plus proche pour une position entre deux points du tracé', () => {
    const model = buildRouteProgressModel(route);

    // Plus proche de l'index 1 (0.001) que de l'index 2 (0.002).
    const progress = computeRouteProgress(model, { latitude: 0.0014, longitude: 0 });

    expect(progress.nextManeuver).toEqual(turnRight);
    expect(progress.distanceToNextManeuver).toBeCloseTo(222.4 - 111.2, 0);
  });

  it("n'a plus de prochaine manœuvre une fois toutes franchies", () => {
    const model = buildRouteProgressModel(route);

    const progress = computeRouteProgress(model, { latitude: 0.004, longitude: 0 }, 3);

    expect(progress.nextManeuver).toBeUndefined();
    expect(progress.distanceToNextManeuver).toBeUndefined();
    expect(progress.distanceRemaining).toBeCloseTo(0, 1);
    expect(progress.durationRemaining).toBeCloseTo(0, 1);
  });

  it('estime la durée restante proportionnellement à la distance restante', () => {
    const model = buildRouteProgressModel(route);

    // À mi-chemin environ (index 2, cumulative ≈ 222.4 m sur 444.8 m) : la
    // durée restante estimée doit être proche de la moitié des 60 s totales.
    const progress = computeRouteProgress(model, { latitude: 0.002, longitude: 0 });

    expect(progress.durationRemaining).toBeCloseTo(30, 0);
  });

  it('signale un grand écart au tracé pour une position hors trajet', () => {
    const model = buildRouteProgressModel(route);

    // ~1.1 km à l'est du tracé (0.01° de longitude à l'équateur).
    const progress = computeRouteProgress(model, { latitude: 0.002, longitude: 0.01 });

    expect(progress.distanceFromRoute).toBeGreaterThan(1000);
  });

  describe('limitation de vitesse', () => {
    const model = buildRouteProgressModel(route);

    it('donne la limitation de la portion en cours', () => {
      expect(computeRouteProgress(model, { latitude: 0.001, longitude: 0 }).speedLimitMps).toBe(13.89);
      expect(computeRouteProgress(model, { latitude: 0.003, longitude: 0 }).speedLimitMps).toBe(22.22);
    });

    it('ne donne rien sur une portion dont la limitation est inconnue', () => {
      // Index 2 : fin de la portion à 50, début d'une portion sans limitation connue.
      expect(computeRouteProgress(model, { latitude: 0.002, longitude: 0 }).speedLimitMps).toBeUndefined();
    });

    it("garde la limitation de la dernière portion à l'arrivée", () => {
      expect(computeRouteProgress(model, { latitude: 0.004, longitude: 0 }, 3).speedLimitMps).toBe(22.22);
    });

    it('ne donne rien hors trajet', () => {
      expect(computeRouteProgress(model, { latitude: 0.001, longitude: 0.01 }).speedLimitMps).toBeUndefined();
    });
  });

  it('calcule la distance de chaque segment pour le récapitulatif complet', () => {
    const model = buildRouteProgressModel(route);

    const steps = getManeuverSteps(model);

    expect(steps).toHaveLength(2);
    expect(steps[0]?.maneuver).toEqual(turnRight);
    expect(steps[0]?.distanceFromPrevious).toBe(0);
    expect(steps[1]?.maneuver).toEqual(arrival);
    expect(steps[1]?.distanceFromPrevious).toBeCloseTo(222.4, 0);
  });

  it('gèle la progression hors itinéraire au lieu de la rattacher au point le plus proche', () => {
    const model = buildRouteProgressModel(route);

    // ~1.1 km à l'est du tracé, à hauteur de l'index 2 : la progression
    // reste celle du calcul précédent (index 1).
    const progress = computeRouteProgress(model, { latitude: 0.002, longitude: 0.01 }, 1);

    expect(progress.pathIndex).toBe(1);
    expect(progress.nextManeuver).toEqual(turnRight);
  });

  it('annonce la manœuvre suivante seulement si elle est enchaînée de près', () => {
    const turnLeft: ManeuverDto = {
      type: 'left',
      instruction: 'Tournez à gauche.',
      point: { latitude: 0.003, longitude: 0 }, // 111 m après turnRight
    };
    const model = buildRouteProgressModel({ ...route, maneuvers: [turnRight, turnLeft, arrival] });

    const atStart = computeRouteProgress(model, { latitude: 0, longitude: 0 });
    expect(atStart.nextManeuver).toEqual(turnRight);
    expect(atStart.nextManeuverIndex).toBe(0);
    expect(atStart.thenManeuver).toEqual(turnLeft);

    // Sans le virage à gauche, l'arrivée est à 222 m du virage à droite :
    // trop loin pour être annoncée en même temps.
    const withoutChain = computeRouteProgress(buildRouteProgressModel(route), { latitude: 0, longitude: 0 });
    expect(withoutChain.thenManeuver).toBeUndefined();
  });

  it("compte les arrêts déjà atteints d'après les manœuvres d'arrivée franchies", () => {
    const intermediateStop: ManeuverDto = {
      type: 'destination',
      instruction: 'Vous êtes arrivé.',
      point: { latitude: 0.002, longitude: 0 },
    };
    const model = buildRouteProgressModel({ ...route, maneuvers: [intermediateStop, arrival] });

    expect(computeRouteProgress(model, { latitude: 0.001, longitude: 0 }).stopsReached).toBe(0);
    expect(computeRouteProgress(model, { latitude: 0.003, longitude: 0 }, 2).stopsReached).toBe(1);
  });

  describe('boucle (départ et arrivée au même endroit)', () => {
    // Aller de 0 à 0.03° (~3,3 km) puis retour au point de départ.
    const outbound = Array.from({ length: 31 }, (_, i) => ({ latitude: i * 0.001, longitude: 0 }));
    const loopPath: GeoPointDto[] = [...outbound, ...outbound.slice(0, -1).reverse()];
    const loopArrival: ManeuverDto = {
      type: 'destination',
      instruction: 'Vous êtes arrivé.',
      point: { latitude: 0, longitude: 0 },
    };
    const turnAround: ManeuverDto = {
      type: 'uturn',
      instruction: 'Faites demi-tour.',
      point: { latitude: 0.03, longitude: 0 },
    };
    const loop: RouteGeometryDto = {
      distanceMeters: 6672,
      durationSeconds: 600,
      path: loopPath,
      maneuvers: [turnAround, loopArrival],
      speedLimits: [],
    };

    it("ne prend pas le départ pour l'arrivée", () => {
      const model = buildRouteProgressModel(loop);

      const progress = computeRouteProgress(model, { latitude: 0, longitude: 0 });

      expect(progress.pathIndex).toBe(0);
      expect(progress.distanceRemaining).toBeGreaterThan(6000);
      expect(progress.nextManeuver).toEqual(turnAround);
    });

    it("rattache l'arrivée à la fin du tracé, pas à son premier passage", () => {
      const steps = getManeuverSteps(buildRouteProgressModel(loop));

      expect(steps[1]?.maneuver).toEqual(loopArrival);
      expect(steps[1]?.distanceFromPrevious).toBeGreaterThan(3000);
    });

    it('distingue le retour de l’aller au même endroit', () => {
      const model = buildRouteProgressModel(loop);

      // Même position (0.01°) : à l'aller (index 10), puis au retour (index 50).
      const outboundProgress = computeRouteProgress(model, { latitude: 0.01, longitude: 0 }, 9);
      const returnProgress = computeRouteProgress(model, { latitude: 0.01, longitude: 0 }, 49);

      expect(outboundProgress.pathIndex).toBe(10);
      expect(returnProgress.pathIndex).toBe(50);
    });
  });
});
