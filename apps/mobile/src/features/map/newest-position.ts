export interface TimedPosition {
  readonly latitude: number;
  readonly longitude: number;
  readonly speedMps: number | undefined;
  readonly recordedAt: number;
}

// Deux sources donnent la position pendant un guidage : le flux de la carte
// (au premier plan) et la tâche d'arrière-plan. On garde celle dont le point
// est le plus récent ; à égalité, la première (celle de la carte, plus
// complète : elle porte aussi le cap).
export function newestPosition<A extends TimedPosition, B extends TimedPosition>(
  first: A | undefined,
  second: B | undefined,
): A | B | undefined {
  if (first === undefined) {
    return second;
  }
  if (second === undefined) {
    return first;
  }
  return second.recordedAt > first.recordedAt ? second : first;
}
