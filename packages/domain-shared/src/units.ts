import type { Brand } from './brand';

/**
 * Toute valeur physique porte son unité SI dans son nom (voir conventions RoadTalk).
 * La conversion en unités d'affichage (km/h, etc.) n'existe que dans la couche de présentation.
 */
export type Meters = Brand<number, 'Meters'>;
export type MetersPerSecond = Brand<number, 'MetersPerSecond'>;
export type Seconds = Brand<number, 'Seconds'>;
export type Degrees = Brand<number, 'Degrees'>;
export type TimestampMs = Brand<number, 'TimestampMs'>;

export function meters(value: number): Meters {
  return value as Meters;
}

export function metersPerSecond(value: number): MetersPerSecond {
  return value as MetersPerSecond;
}

export function seconds(value: number): Seconds {
  return value as Seconds;
}

export function degrees(value: number): Degrees {
  return value as Degrees;
}

export function timestampMs(value: number): TimestampMs {
  return value as TimestampMs;
}
