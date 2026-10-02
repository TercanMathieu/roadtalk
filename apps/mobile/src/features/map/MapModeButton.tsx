import type React from 'react';
import { Pressable } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './MapModeButton.styles';

interface Props {
  // Aucun mode de perspective 3D n'existe (MapLibre reste en vue zénithale
  // inclinée classique, voir map.config.ts) — l'appui signale juste
  // l'indisponibilité, à l'appelant de l'afficher (Snackbar côté MapScreen).
  readonly onPress: () => void;
  // Empile ce bouton juste au-dessus de RecenterButton, dont la position
  // varie elle-même selon la présence de TripSummaryCard — calculé par
  // l'écran parent plutôt que dupliqué ici.
  readonly bottom: number;
}

export function MapModeButton({ onPress, bottom }: Props): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Mode de perspective 3D"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { bottom }, pressed ? styles.pressed : null]}
    >
      <Text variant="captionStrong" color={colors.accentLight}>
        3D
      </Text>
    </Pressable>
  );
}
