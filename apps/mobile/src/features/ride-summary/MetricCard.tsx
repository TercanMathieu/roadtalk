import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './MetricCard.styles';

interface Props {
  readonly icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  readonly label: string;
  readonly value: string;
  readonly unit: string;
}

export function MetricCard({ icon, label, value, unit }: Props): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text variant="mono" color={colors.textDense}>
          {label}
        </Text>
        <MaterialCommunityIcons name={icon} size={14} color={colors.textDense} />
      </View>
      <View style={styles.valueRow}>
        <Text variant="monoBold" color={colors.textPrimary} tabularNums style={{ fontSize: 28 }}>
          {value}
        </Text>
        <Text variant="mono" color={colors.textDense}>
          {unit}
        </Text>
      </View>
    </View>
  );
}
