import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './Avatar.styles';

interface Props {
  // Pseudo dont on affiche l'initiale — undefined ou vide tant qu'il n'est
  // pas choisi : une silhouette prend alors sa place.
  readonly username: string | undefined;
  readonly size: number;
}

// Portrait d'un utilisateur. Pas de photo pour l'instant (le stockage des
// médias n'est pas construit) : l'initiale du pseudo en tient lieu, et c'est
// ce composant qui affichera la photo quand elle existera.
export function Avatar({ username, size }: Props): React.JSX.Element {
  const initial = username !== undefined && username.length > 0 ? username.charAt(0).toUpperCase() : undefined;

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {initial !== undefined ? (
        <Text variant="title" style={{ fontSize: size * 0.42, lineHeight: size * 0.5 }}>
          {initial}
        </Text>
      ) : (
        <MaterialCommunityIcons name="account" size={size * 0.5} color={colors.textSecondary} />
      )}
    </View>
  );
}
