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

const METERS_ROUNDING = 10;

// Pour une distance à une manœuvre proche (guidage), pas le récapitulatif de
// trajet : "80 m" se lit d'un coup d'œil, "0.1 km" demande un calcul (C2).
// Arrondi à la dizaine de mètres la plus proche — la précision GPS ne
// justifie de toute façon pas plus fin.
export function formatManeuverDistance(distanceMeters: number): string {
  if (distanceMeters < METERS_PER_KM) {
    const rounded = Math.max(METERS_ROUNDING, Math.round(distanceMeters / METERS_ROUNDING) * METERS_ROUNDING);
    return `${String(rounded)} m`;
  }
  return formatDistanceKm(distanceMeters);
}

const MPS_TO_KMH = 3.6;

// Bruit Doppler GPS à l'arrêt : location.speed remonte souvent quelques
// dixièmes de m/s (≈ 2-4 km/h affichés) même véhicule immobile. Même seuil
// que la fiabilité du cap ailleurs dans l'app (useVehiclePosition,
// MIN_SPEED_FOR_HEADING_MPS) — en dessous, ce n'est plus une vitesse
// significative. Affichage seulement : la valeur Doppler brute reste la
// source de vérité partout ailleurs (jamais dérivée de deux positions).
const SPEED_DISPLAY_DEADZONE_MPS = 1.39;

// undefined tant qu'aucune vitesse Doppler fiable n'est arrivée (voir
// useVehiclePosition) — jamais une chaîne vide ou "0 km/h" qui laisserait
// croire à une mesure réelle à l'arrêt du flux GPS.
export function formatSpeedKmh(speedMps: number | undefined): string {
  if (speedMps === undefined) {
    return '–';
  }
  if (speedMps < SPEED_DISPLAY_DEADZONE_MPS) {
    return '0';
  }
  return String(Math.round(speedMps * MPS_TO_KMH));
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
