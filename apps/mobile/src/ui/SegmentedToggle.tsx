import type React from 'react';
import { Pressable, View } from 'react-native';

import { styles } from './SegmentedToggle.styles';
import { Text } from './Text';
import { colors } from './tokens';

interface Option<T extends string> {
  readonly value: T;
  readonly label: string;
}

interface Props<T extends string> {
  readonly options: readonly Option<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}

// Sélecteur à options exclusives en forme de pilule (ex. km/h ↔ mph) — la
// sélection se lit à la couleur de fond, pas à une coche séparée.
export function SegmentedToggle<T extends string>({ options, value, onChange }: Props<T>): React.JSX.Element {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => {
              onChange(option.value);
            }}
            style={[styles.option, isActive ? styles.optionActive : null]}
          >
            <Text
              variant="monoBold"
              color={isActive ? colors.onAccentLight : colors.textDense}
              style={styles.optionLabel}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
