import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './CacheGaugeCard.styles';

// Aucun système de cache hors-ligne n'existe encore (pré-cache de corridor,
// voir CLAUDE.md) : la jauge reste à 0 plutôt que d'afficher des chiffres
// inventés qui se feraient passer pour de la vraie télémétrie de stockage.
export function CacheGaugeCard(): React.JSX.Element {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="harddisk" size={16} color={colors.textDense} />
          <Text variant="body">Gestionnaire de cache</Text>
        </View>
        <View style={styles.sizeGroup}>
          <Text variant="monoBold" color={colors.accentLight} style={styles.sizeValue}>
            0{' '}
          </Text>
          <Text variant="mono" color={colors.textDense}>
            Mo
          </Text>
        </View>
      </View>
      <View style={styles.bar} />
      <View style={styles.breakdown}>
        <Text variant="mono" color={colors.textDense}>
          {'Corridor balade\n(0 Mo)'}
        </Text>
        <Text variant="mono" color={colors.textDense}>
          {'Tuiles vectorielles\n(0 Mo)'}
        </Text>
      </View>
    </View>
  );
}
