import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ManeuverDto } from '@roadtalk/contracts';
import type React from 'react';
import { View } from 'react-native';

import { colors, Text } from '../../ui';
import { formatManeuverDistance } from '../routing/format';
import { getManeuverIcon } from './maneuver-icons';
import { getManeuverLabel } from './maneuver-labels';
import { styles } from './ManeuverBanner.styles';

interface Props {
  readonly maneuver: ManeuverDto;
  readonly distanceMeters: number;
}

// Indication de virage courte ("Tournez à droite"), jamais de nom de rue —
// en roulant, une adresse demande de lire et de comparer, un sens de
// direction se lit d'un coup d'œil (C2).
export function ManeuverBanner({ maneuver, distanceMeters }: Props): React.JSX.Element {
  return (
    <View style={styles.banner}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={getManeuverIcon(maneuver.type)} size={32} color={colors.background} />
      </View>
      <View style={styles.texts}>
        <Text variant="title" tabularNums>
          {formatManeuverDistance(distanceMeters)}
        </Text>
        <Text variant="body" color={colors.textSecondary} numberOfLines={1}>
          {getManeuverLabel(maneuver)}
        </Text>
      </View>
    </View>
  );
}
