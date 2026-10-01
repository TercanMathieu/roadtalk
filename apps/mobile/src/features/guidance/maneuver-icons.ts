import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ManeuverType } from '@roadtalk/contracts';
import type React from 'react';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const MANEUVER_ICONS: Record<ManeuverType, IconName> = {
  start: 'navigation',
  continue: 'arrow-up-bold',
  'slight-right': 'arrow-top-right-thin',
  right: 'arrow-top-right-thick',
  'sharp-right': 'arrow-right-bold',
  'slight-left': 'arrow-top-left-thin',
  left: 'arrow-top-left-thick',
  'sharp-left': 'arrow-left-bold',
  uturn: 'arrow-u-up-left-bold',
  roundabout: 'rotate-right',
  merge: 'call-merge',
  ferry: 'ferry',
  destination: 'flag-checkered',
};

export function getManeuverIcon(type: ManeuverType): IconName {
  return MANEUVER_ICONS[type];
}
