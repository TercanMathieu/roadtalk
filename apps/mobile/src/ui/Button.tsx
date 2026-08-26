import type React from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { styles } from './Button.styles';
import { Text } from './Text';
import { colors } from './tokens';

type ButtonVariant = 'primary' | 'secondary';

interface Props extends Omit<PressableProps, 'style'> {
  readonly label: string;
  readonly variant?: ButtonVariant;
}

export function Button(props: Props): React.JSX.Element {
  const { label, variant = 'primary', disabled, ...rest } = props;
  const isDisabled = disabled ?? false;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        isDisabled ? styles.disabled : null,
        pressed ? styles.pressed : null,
      ]}
      {...rest}
    >
      <Text variant="body" color={variant === 'primary' ? colors.background : colors.textPrimary}>
        {label}
      </Text>
    </Pressable>
  );
}
