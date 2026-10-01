import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { Pressable, View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './RouteStatusChips.styles';

// Aperçu visuel pur : ni pré-cache hors-ligne par corridor (voir Réglages,
// section cartes hors-ligne), ni préférence "routes sinueuses" ne sont
// construits. Contrairement aux boutons d'action (recherche vocale, import
// GPX), ces puces n'ont rien à presser — pas de signal d'indisponibilité
// nécessaire, juste un habillage qui ne prétend piloter aucune décision.
//
// La puce "Générer IA" est la seule réellement interactive : point d'entrée
// réel (navigation) vers un écran qui, lui, reste un aperçu (voir
// AiRouteGeneratorScreen) — la navigation elle-même n'est pas mockée.
export function RouteStatusChips(): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.pillChip}>
        <MaterialCommunityIcons name="cloud-check-outline" size={14} color={colors.textDense} />
        <Text variant="mono" color={colors.textDense}>
          Pack hors-ligne
        </Text>
      </View>

      <View style={styles.trailingGroup}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Générer un itinéraire avec l'IA"
          onPress={() => {
            router.push('/ai-route-generator');
          }}
          style={styles.aiChip}
        >
          <MaterialCommunityIcons name="creation" size={12} color={colors.onAccentLight} />
          <Text variant="monoBold" color={colors.onAccentLight} style={styles.badgeLabel}>
            IA
          </Text>
        </Pressable>

        <View style={styles.badge}>
          <MaterialCommunityIcons name="road-variant" size={12} color={colors.accentLight} />
          <Text variant="monoBold" color={colors.accentLight} style={styles.badgeLabel}>
            {'VIRAGES\nMAX'}
          </Text>
        </View>
      </View>
    </View>
  );
}
