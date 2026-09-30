import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './SettingsSectionHeader.styles';

interface Props {
  readonly icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  readonly title: string;
  readonly trailing?: string;
}

export function SettingsSectionHeader({ icon, title, trailing }: Props): React.JSX.Element {
  return (
    <View style={styles.header}>
      <View style={styles.titleGroup}>
        <MaterialCommunityIcons name={icon} size={14} color={colors.accentLight} />
        <Text variant="mono" color={colors.accentLight}>
          {title}
        </Text>
      </View>
      {trailing !== undefined ? (
        <Text variant="mono" color={colors.textDense}>
          {trailing}
        </Text>
      ) : null}
    </View>
  );
}
