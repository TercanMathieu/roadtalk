// Conversion en unités d'affichage, propre à l'écran Résumé de balade —
// mêmes conventions que routing/format.ts, mais des besoins distincts (pas
// de zone morte anti-bruit : une vitesse moyenne ou max n'est pas une
// lecture instantanée bruitée, inutile de la masquer sous un seuil).

const CLOCK_FORMATTER = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const ELEVATION_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const DISTANCE_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const METERS_PER_KM = 1000;

const MPS_TO_KMH = 3.6;

export function formatSpeedKmhValue(speedMps: number): string {
  return String(Math.round(speedMps * MPS_TO_KMH));
}

// Valeur seule, sans unité — pour un affichage qui sépare le nombre (gros,
// en avant) de l'unité (petite, à côté) plutôt qu'une chaîne combinée.
export function formatDistanceKmValue(distanceMeters: number): string {
  return DISTANCE_FORMATTER.format(distanceMeters / METERS_PER_KM);
}

export function formatElevationMeters(elevationMeters: number): string {
  const rounded = Math.round(elevationMeters);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${ELEVATION_FORMATTER.format(rounded)}`;
}

export function formatClockTime(timestampMs: number): string {
  return CLOCK_FORMATTER.format(new Date(timestampMs));
}

// Pourcentage entier : "100 %", pas "100,0 %" — la précision décimale ne
// change rien à la lecture d'un indicateur de qualité de fix GPS.
export function formatPercent(ratio: number): string {
  return `${String(Math.round(ratio * 100))} %`;
}
