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
        <MaterialCommunityIcons name={icon} size={14} color={colors.textSecondary} />
        <Text variant="label" color={colors.textSecondary}>
          {title}
        </Text>
      </View>
      {trailing !== undefined ? (
        <Text variant="caption" color={colors.textSecondary}>
          {trailing}
        </Text>
      ) : null}
    </View>
  );
}
