import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './RouteStatusChips.styles';

// Aperçu visuel pur : ni pré-cache hors-ligne par corridor (voir Réglages,
// section cartes hors-ligne), ni préférence "routes sinueuses" ne sont
// construits. Contrairement aux boutons d'action (recherche vocale, import
// GPX), ces puces n'ont rien à presser — pas de signal d'indisponibilité
// nécessaire, juste un habillage qui ne prétend piloter aucune décision.
export function RouteStatusChips(): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.pillChip}>
        <MaterialCommunityIcons name="cloud-check-outline" size={14} color={colors.textDense} />
        <Text variant="mono" color={colors.textDense}>
          Pack hors-ligne
        </Text>
      </View>

      <View style={styles.badge}>
        <MaterialCommunityIcons name="road-variant" size={12} color={colors.accentLight} />
        <Text variant="monoBold" color={colors.accentLight} style={styles.badgeLabel}>
          {'VIRAGES\nMAX'}
        </Text>
      </View>
    </View>
  );
}
