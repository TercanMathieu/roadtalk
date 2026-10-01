import type React from 'react';
import { useEffect, useRef } from 'react';
import { Animated, Pressable } from 'react-native';

import { styles, THUMB_TRAVEL } from './Toggle.styles';
import { colors } from './tokens';

interface Props {
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
  readonly accessibilityLabel: string;
}

const ANIMATION_DURATION_MS = 150;

// Piste 56×32 (fidèle au design) plus petite que la cible tactile minimale
// du projet (64dp, gants) — `hitSlop` porte la zone d'appui effective à 64dp
// sans agrandir le rendu visuel (C2).
export function Toggle({ value, onValueChange, accessibilityLabel }: Props): React.JSX.Element {
  const translateX = useRef(new Animated.Value(value ? THUMB_TRAVEL : 0)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? THUMB_TRAVEL : 0,
      duration: ANIMATION_DURATION_MS,
      useNativeDriver: true,
    }).start();
  }, [value, translateX]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={{ top: 16, bottom: 16, left: 4, right: 4 }}
      onPress={() => {
        onValueChange(!value);
      }}
      style={[styles.track, { backgroundColor: value ? colors.accent : colors.surfaceMuted }]}
    >
      <Animated.View style={[styles.thumb, { transform: [{ translateX }] }]} />
    </Pressable>
  );
}
