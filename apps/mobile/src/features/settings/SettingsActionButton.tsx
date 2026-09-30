import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { Pressable, View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './SettingsActionButton.styles';

interface Props {
  readonly icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  readonly label: string;
  readonly description?: string;
  readonly variant?: 'default' | 'danger';
  readonly onPress: () => void;
}

export function SettingsActionButton({
  icon,
  label,
  description,
  variant = 'default',
  onPress,
}: Props): React.JSX.Element {
  const contentColor = variant === 'danger' ? colors.onDangerContainer : colors.textPrimary;

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          variant === 'danger' ? styles.danger : styles.default,
          pressed ? styles.pressed : null,
        ]}
      >
        <MaterialCommunityIcons name={icon} size={18} color={contentColor} />
        <Text variant="monoBold" color={contentColor} style={{ fontSize: 18 }}>
          {label}
        </Text>
      </Pressable>
      {description !== undefined ? (
        <Text variant="mono" color={colors.textDense} style={styles.description}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}
