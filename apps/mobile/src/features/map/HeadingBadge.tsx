import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './HeadingBadge.styles';

const ICON_SIZE = 15;
const DEGREES_IN_CIRCLE = 360;

interface Props {
  // undefined tant qu'aucun cap fiable n'est encore disponible (voir
  // useVehiclePosition) — le badge reste alors absent plutôt que d'afficher
  // un cap figé ou inventé.
  readonly headingDeg: number | undefined;
}

export function HeadingBadge({ headingDeg }: Props): React.JSX.Element | null {
  if (headingDeg === undefined) {
    return null;
  }

  const normalized = Math.round(headingDeg) % DEGREES_IN_CIRCLE;

  return (
    <View style={styles.badge}>
      <MaterialCommunityIcons name="compass-outline" size={ICON_SIZE} color={colors.textPrimary} />
      <Text variant="monoBold" color={colors.textPrimary}>
        CAP {String(normalized).padStart(3, '0')}°
      </Text>
    </View>
  );
}
