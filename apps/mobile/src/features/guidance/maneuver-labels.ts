import type { ManeuverDto, ManeuverType } from '@roadtalk/contracts';

// Indication de virage courte, jamais de nom de rue — en roulant, "tournez à
// droite" se lit d'un coup d'œil, un nom de rue demande de lire et de
// comparer (C2). L'instruction complète de Valhalla (maneuver.instruction)
// n'est délibérément pas utilisée ici pour la même raison : elle inclut les
// noms de rue.
//
// "roundabout" seul (sans numéro de sortie) ne couvre que la manœuvre de
// sortie du rond-point (voir getManeuverLabel) — l'entrée, qui porte le
// numéro à compter, a son propre texte généré dynamiquement.
const MANEUVER_LABELS: Record<ManeuverType, string> = {
  start: 'Démarrage',
  continue: 'Continuez tout droit',
  'slight-right': 'Légèrement à droite',
  right: 'Tournez à droite',
  'sharp-right': 'Tournez fortement à droite',
  'slight-left': 'Légèrement à gauche',
  left: 'Tournez à gauche',
  'sharp-left': 'Tournez fortement à gauche',
  uturn: 'Faites demi-tour',
  roundabout: 'Sortez du rond-point',
  merge: 'Rejoignez la voie',
  ferry: 'Empruntez le ferry',
  destination: 'Vous êtes arrivé',
};

// 1 → "1re", le reste → "2e", "3e", ... — même convention que les
// instructions françaises de Valhalla (vérifié en direct : "prenez la 2e
// sortie").
function ordinal(n: number): string {
  return n === 1 ? '1re' : `${String(n)}e`;
}

// Le numéro de sortie (roundaboutExitNumber) n'est présent que sur la
// manœuvre d'ENTRÉE dans un rond-point, jamais sur celle de sortie qui suit
// (vérifié contre Valhalla) — c'est ce champ, pas le type, qui distingue les
// deux dans le texte affiché.
export function getManeuverLabel(maneuver: ManeuverDto): string {
  if (maneuver.roundaboutExitNumber !== undefined) {
    return `Au rond-point, prenez la ${ordinal(maneuver.roundaboutExitNumber)} sortie`;
  }
  return MANEUVER_LABELS[maneuver.type];
}
