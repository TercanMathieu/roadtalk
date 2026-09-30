// Conversion en unités d'affichage : n'existe que dans la couche
// présentation (convention du projet — les mètres/secondes bruts ne
// circulent jamais formatés ailleurs).

const KM_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const CLOCK_FORMATTER = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

const METERS_PER_KM = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

export function formatDistanceKm(distanceMeters: number): string {
  return `${KM_FORMATTER.format(distanceMeters / METERS_PER_KM)} km`;
}

export function formatDuration(durationSeconds: number): string {
  const totalMinutes = Math.round(durationSeconds / SECONDS_PER_MINUTE);
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;

  if (hours === 0) {
    return `${String(minutes)} min`;
  }
  return `${String(hours)} h ${String(minutes).padStart(2, '0')}`;
}

// L'heure d'arrivée se calcule côté client, à partir de l'heure locale de
// l'appareil au moment de l'affichage — pas de fuseau horaire à gérer
// puisqu'on ne fait qu'ajouter une durée à "maintenant".
export function formatArrivalTime(durationSeconds: number): string {
  const arrivalDate = new Date(Date.now() + durationSeconds * 1000);
  return CLOCK_FORMATTER.format(arrivalDate);
}
