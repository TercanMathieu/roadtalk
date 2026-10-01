import type { ManeuverType } from '@roadtalk/contracts';

// Table de correspondance vers l'enum Valhalla (DirectionsLeg_Maneuver_Type),
// vérifiée empiriquement contre le moteur réel plutôt que recopiée de
// mémoire — un Paris→Maisons-Alfort a fait apparaître 1, 4→6, 9, 10, 15, 16,
// 17, 20, 24 ; le reste (2/3, 7/8, 11 à 14, 18/19, 21 à 23, 25 à 29) vient de
// la documentation officielle, non recroisé sur le terrain.
const VALHALLA_TYPE_TO_MANEUVER_TYPE: Record<number, ManeuverType> = {
  1: 'start',
  2: 'start',
  3: 'start',
  4: 'destination',
  5: 'destination',
  6: 'destination',
  7: 'continue', // "Becomes" — la route change de nom sans changer de direction.
  8: 'continue',
  9: 'slight-right',
  10: 'right',
  11: 'sharp-right',
  12: 'uturn',
  13: 'uturn',
  14: 'sharp-left',
  15: 'left',
  16: 'slight-left',
  17: 'right', // Bretelle tout droit — rendue comme une bifurcation à négocier.
  18: 'right',
  19: 'left',
  20: 'right', // Sortie d'autoroute.
  21: 'left',
  22: 'continue', // "Stay straight" à un embranchement.
  23: 'right',
  24: 'left',
  25: 'merge',
  26: 'roundabout',
  27: 'roundabout',
  28: 'ferry',
  29: 'ferry',
};

// Code non reconnu (nouvelle valeur ajoutée par une future version de
// Valhalla) : mieux vaut une icône générique que planter sur une réponse par
// ailleurs valide.
const FALLBACK_MANEUVER_TYPE: ManeuverType = 'continue';

export function mapValhallaManeuverType(valhallaType: number): ManeuverType {
  return VALHALLA_TYPE_TO_MANEUVER_TYPE[valhallaType] ?? FALLBACK_MANEUVER_TYPE;
}
