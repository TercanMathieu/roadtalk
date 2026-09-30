import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { Pressable } from 'react-native';

import { colors } from '../../ui';
import { styles } from './RecenterButton.styles';

const ICON_SIZE = 28;

interface Props {
  readonly isFollowing: boolean;
  readonly onPress: () => void;
  // Remonte le bouton au-dessus d'un élément inférieur (ex. TripSummaryCard),
  // dont la hauteur varie selon son contenu (chargement, erreur, ou les trois
  // statistiques) — undefined garde la position par défaut du style.
  readonly bottom?: number;
}

// Toujours visible, jamais escamoté : une cible qui apparaît et disparaît est
// une cible mouvante, à proscrire pour un appui à l'aveugle avec des gants
// (C2). C'est la couleur qui porte l'état — l'accent signale l'action
// disponible, le gris que la vue est déjà centrée (DA : un seul accent, pour
// l'action).
export function RecenterButton({ isFollowing, onPress, bottom }: Props): React.JSX.Element {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Centrer la carte sur ma position"
      accessibilityState={{ selected: isFollowing }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        bottom !== undefined ? { bottom } : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <MaterialCommunityIcons
        name="crosshairs-gps"
        size={ICON_SIZE}
        color={isFollowing ? colors.textSecondary : colors.accent}
      />
    </Pressable>
  );
}
