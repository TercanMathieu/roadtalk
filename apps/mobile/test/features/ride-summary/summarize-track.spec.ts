import { degrees, meters, metersPerSecond, timestampMs } from '@roadtalk/domain-shared';
import { describe, expect, it } from 'vitest';

import { summarizeTrack } from '../../../src/features/ride-summary/summarize-track';
import type { TrackPoint } from '../../../src/features/ride-summary/track-point';

const START = 1_700_000_000_000;

function point(params: {
  lat: number;
  lon: number;
  atSeconds?: number;
  speed?: number;
  altitude?: number;
  accuracy?: number;
}): TrackPoint {
  return {
    position: { latitude: degrees(params.lat), longitude: degrees(params.lon) },
    recordedAt: timestampMs(START + (params.atSeconds ?? 0) * 1000),
    speedMps: params.speed === undefined ? undefined : metersPerSecond(params.speed),
    altitudeMeters: params.altitude === undefined ? undefined : meters(params.altitude),
    accuracyMeters: meters(params.accuracy ?? 5),
  };
}

// ~0,0001° de latitude ≈ 11,1 m : de quoi franchir le seuil de déplacement.
const STEP = 0.0001;

describe('summarizeTrack', () => {
  it('rend un résumé à zéro sur un tracé vide', () => {
    expect(summarizeTrack([])).toEqual({
      distanceMeters: 0,
      durationSeconds: 0,
      averageSpeedMps: 0,
      maxSpeedMps: 0,
      elevationGainMeters: 0,
      stoppedSeconds: 0,
      usableFixRatio: 0,
    });
  });

  it('rend un résumé à zéro quand aucun fix n’est assez précis', () => {
    const summary = summarizeTrack([
      point({ lat: 48.85, lon: 2.35, accuracy: 80, speed: 30 }),
      point({ lat: 48.86, lon: 2.35, atSeconds: 60, accuracy: 120, speed: 30 }),
    ]);

    expect(summary.distanceMeters).toBe(0);
    expect(summary.maxSpeedMps).toBe(0);
  });

  it('additionne les segments et déduit la durée des horodatages', () => {
    const summary = summarizeTrack([
      point({ lat: 48.85, lon: 2.35, atSeconds: 0 }),
      point({ lat: 48.85 + STEP, lon: 2.35, atSeconds: 10 }),
      point({ lat: 48.85 + 2 * STEP, lon: 2.35, atSeconds: 20 }),
    ]);

    expect(summary.distanceMeters).toBeCloseTo(22.2, 0);
    expect(summary.durationSeconds).toBe(20);
    expect(summary.averageSpeedMps).toBeCloseTo(1.11, 2);
  });

  // LE défaut classique d'un compteur naïf : la dérive du GPS à l'arrêt.
  it("n'invente aucune distance sur un appareil immobile qui dérive", () => {
    const jitter = [0, 0.000008, -0.000006, 0.000009, -0.000004, 0.000007];
    const summary = summarizeTrack(
      jitter.map((delta, index) => point({ lat: 48.85 + delta, lon: 2.35, atSeconds: index })),
    );

    expect(summary.distanceMeters).toBe(0);
  });

  it('écarte les fixes imprécis mais garde les bons', () => {
    const summary = summarizeTrack([
      point({ lat: 48.85, lon: 2.35, atSeconds: 0 }),
      // Fix aberrant : loin, et annoncé comme très incertain.
      point({ lat: 48.95, lon: 2.35, atSeconds: 5, accuracy: 200 }),
      point({ lat: 48.85 + STEP, lon: 2.35, atSeconds: 10 }),
    ]);

    expect(summary.distanceMeters).toBeCloseTo(11.1, 0);
  });

  it('prend la vitesse maximale mesurée, jamais une vitesse dérivée', () => {
    const summary = summarizeTrack([
      point({ lat: 48.85, lon: 2.35, atSeconds: 0, speed: 12 }),
      point({ lat: 48.85 + STEP, lon: 2.35, atSeconds: 10, speed: 31.4 }),
      point({ lat: 48.85 + 2 * STEP, lon: 2.35, atSeconds: 20, speed: 8 }),
    ]);

    expect(summary.maxSpeedMps).toBe(31.4);
  });

  it('ignore les points sans vitesse pour le maximum', () => {
    const summary = summarizeTrack([
      point({ lat: 48.85, lon: 2.35, atSeconds: 0 }),
      point({ lat: 48.85 + STEP, lon: 2.35, atSeconds: 10, speed: 9 }),
    ]);

    expect(summary.maxSpeedMps).toBe(9);
  });

  it('compte une montée franche', () => {
    const summary = summarizeTrack([
      point({ lat: 48.85, lon: 2.35, atSeconds: 0, altitude: 100 }),
      point({ lat: 48.85 + STEP, lon: 2.35, atSeconds: 10, altitude: 130 }),
      point({ lat: 48.85 + 2 * STEP, lon: 2.35, atSeconds: 20, altitude: 120 }),
      point({ lat: 48.85 + 3 * STEP, lon: 2.35, atSeconds: 30, altitude: 150 }),
    ]);

    // 100→130 = 30, puis creux à 120, puis 120→150 = 30.
    expect(summary.elevationGainMeters).toBeCloseTo(60, 5);
  });

  // Sans hystérésis, ce parcours plat "grimperait" plusieurs dizaines de mètres.
  it("ne compte aucun dénivelé sur du bruit d'altitude", () => {
    const noise = [100, 102, 99, 103, 98, 101, 100];
    const summary = summarizeTrack(
      noise.map((altitude, index) =>
        point({ lat: 48.85 + index * STEP, lon: 2.35, atSeconds: index * 10, altitude }),
      ),
    );

    expect(summary.elevationGainMeters).toBe(0);
  });

  it('gère un tracé réduit à un seul point', () => {
    const summary = summarizeTrack([point({ lat: 48.85, lon: 2.35, speed: 4 })]);

    expect(summary).toMatchObject({
      distanceMeters: 0,
      durationSeconds: 0,
      averageSpeedMps: 0,
      maxSpeedMps: 4,
    });
  });

  it('cumule le temps passé sous le seuil de vitesse comme temps à l’arrêt', () => {
    const summary = summarizeTrack([
      point({ lat: 48.85, lon: 2.35, atSeconds: 0, speed: 0.2 }),
      point({ lat: 48.85, lon: 2.35, atSeconds: 30, speed: 0.1 }),
      point({ lat: 48.85 + STEP, lon: 2.35, atSeconds: 40, speed: 15 }),
      point({ lat: 48.85 + 2 * STEP, lon: 2.35, atSeconds: 50, speed: 15 }),
    ]);

    // Chaque segment compte sur la vitesse du point qui le précède : arrêté
    // à 0s (segment 0→30s, 30s) et encore arrêté à 30s (segment 30→40s,
    // 10s) — seul le segment 40→50s, qui part d'un point roulant, n'est pas
    // compté.
    expect(summary.stoppedSeconds).toBe(40);
  });

  it('calcule la part de fixes exploitables pour refléter la qualité réelle du GPS', () => {
    const summary = summarizeTrack([
      point({ lat: 48.85, lon: 2.35, atSeconds: 0, accuracy: 5 }),
      point({ lat: 48.85 + STEP, lon: 2.35, atSeconds: 10, accuracy: 5 }),
      point({ lat: 48.85 + 2 * STEP, lon: 2.35, atSeconds: 20, accuracy: 80 }),
      point({ lat: 48.85 + 3 * STEP, lon: 2.35, atSeconds: 30, accuracy: 5 }),
    ]);

    expect(summary.usableFixRatio).toBe(0.75);
  });
});
