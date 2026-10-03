// Plus petit horodatage en millisecondes que l'on puisse rencontrer : 1973.
// Tout nombre en dessous ne peut être que des secondes.
const MIN_PLAUSIBLE_EPOCH_MS = 1e11;

// Le moteur de localisation natif livre l'horodatage en secondes (avec
// décimales) sur iOS et en millisecondes sur Android. Tout le reste du code
// — résumé de balade, envoi au serveur — attend des millisecondes entières :
// en secondes, une balade de 3 minutes durait 0,18 s et sa vitesse moyenne
// s'affichait 1000 fois trop haute.
export function toEpochMs(timestamp: number): number {
  return Math.round(timestamp < MIN_PLAUSIBLE_EPOCH_MS ? timestamp * 1000 : timestamp);
}
