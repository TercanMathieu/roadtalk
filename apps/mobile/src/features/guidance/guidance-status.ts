// État du suivi de l'itinéraire, partagé par le bandeau (ManeuverBanner) et la
// voix (voice-announcements) : les deux disent la même chose.
export type GuidanceStatus = 'on-route' | 'off-route' | 'rerouting';
