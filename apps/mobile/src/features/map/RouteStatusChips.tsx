import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { Pressable, View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './RouteStatusChips.styles';

// Une seule puce, la seule qui mène quelque part : l'entrée vers la
// génération d'itinéraire par IA (écran qui reste lui-même un aperçu, voir
// AiRouteGeneratorScreen). Les anciennes puces décoratives ("Pack
// hors-ligne", "Virages max") ne pilotaient rien et ont été retirées.
export function RouteStatusChips(): React.JSX.Element {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Générer un itinéraire avec l'IA"
        onPress={() => {
          router.push('/ai-route-generator');
        }}
        style={({ pressed }) => [styles.aiChip, pressed ? styles.pressed : null]}
      >
        <MaterialCommunityIcons name="creation" size={14} color={colors.accent} />
        <Text variant="captionStrong" color={colors.textPrimary}>
          Itinéraire IA
        </Text>
      </Pressable>
    </View>
  );
}
