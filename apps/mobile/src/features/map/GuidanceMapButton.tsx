import type React from 'react';
import { Pressable } from 'react-native';

import { styles } from './GuidanceMapButton.styles';

interface Props {
  readonly accessibilityLabel: string;
  readonly onPress: () => void;
  readonly children: React.ReactNode;
}

// Taille sous le plancher standard de l'app (64dp) : décision explicite de
// l'utilisateur, voir le commentaire dans GuidanceMapButton.styles.ts.
export function GuidanceMapButton({ accessibilityLabel, onPress, children }: Props): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
    >
      {children}
    </Pressable>
  );
}
