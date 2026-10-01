import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ManeuverDto } from '@roadtalk/contracts';
import type React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, Text } from '../../ui';
import { formatManeuverDistanceParts } from '../routing/format';
import { getManeuverIcon } from './maneuver-icons';
import { getManeuverLabel } from './maneuver-labels';
import { styles } from './ManeuverBanner.styles';

const ICON_SIZE = 24;

interface Props {
  readonly maneuver: ManeuverDto;
  readonly distanceMeters: number;
}

const UNIT_WORDS = { m: 'MÈTRES', km: 'KM' } as const;

// Indication de virage courte ("Tournez à droite"), jamais de nom de rue —
// en roulant, une adresse demande de lire et de comparer, un sens de
// direction se lit d'un coup d'œil (C2).
export function ManeuverBanner({ maneuver, distanceMeters }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { value, unit } = formatManeuverDistanceParts(distanceMeters);

  return (
    <View style={[styles.banner, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.iconSquare}>
        <MaterialCommunityIcons name={getManeuverIcon(maneuver.type)} size={ICON_SIZE} color={colors.accent} />
      </View>
      <View style={styles.texts}>
        <View style={styles.distanceRow}>
          <Text variant="display" tabularNums style={styles.distanceValue}>
            {value}
          </Text>
          <Text variant="monoBold" color={colors.accentLight}>
            {UNIT_WORDS[unit]}
          </Text>
        </View>
        <Text variant="title" color={colors.textSecondary} numberOfLines={1} style={styles.directionLabel}>
          {getManeuverLabel(maneuver)}
        </Text>
      </View>
    </View>
  );
}
