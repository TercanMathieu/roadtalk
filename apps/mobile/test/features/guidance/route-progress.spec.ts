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

    const progress = computeRouteProgress(model, { latitude: 0.004, longitude: 0 });

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

  it('calcule la distance de chaque segment pour le récapitulatif complet', () => {
    const model = buildRouteProgressModel(route);

    const steps = getManeuverSteps(model);

    expect(steps).toHaveLength(2);
    expect(steps[0]?.maneuver).toEqual(turnRight);
    expect(steps[0]?.segmentDistance).toBeCloseTo(222.4, 0);
    expect(steps[1]?.maneuver).toEqual(arrival);
    expect(steps[1]?.segmentDistance).toBe(0);
  });
});
