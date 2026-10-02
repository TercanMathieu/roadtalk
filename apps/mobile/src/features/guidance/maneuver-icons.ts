import { MaterialIcons } from '@expo/vector-icons';
import type { ManeuverType } from '@roadtalk/contracts';
import type React from 'react';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

// Pictogrammes de signalisation (jeu MaterialIcons) : la flèche part du bas,
// monte, puis tourne — le dessin d'un vrai virage, lisible sans le texte. Les
// simples flèches diagonales utilisées avant ne distinguaient pas "tournez à
// droite" de "légèrement à droite".
const MANEUVER_ICONS: Record<ManeuverType, IconName> = {
  start: 'navigation',
  continue: 'straight',
  'slight-right': 'turn-slight-right',
  right: 'turn-right',
  'sharp-right': 'turn-sharp-right',
  'slight-left': 'turn-slight-left',
  left: 'turn-left',
  'sharp-left': 'turn-sharp-left',
  uturn: 'u-turn-left',
  // Sens giratoire français (anti-horaire, sortie sur la droite).
  roundabout: 'roundabout-right',
  merge: 'merge',
  ferry: 'directions-ferry',
  destination: 'sports-score',
};

export function getManeuverIcon(type: ManeuverType): IconName {
  return MANEUVER_ICONS[type];
}
