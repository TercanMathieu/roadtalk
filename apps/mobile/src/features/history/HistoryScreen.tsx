import type React from 'react';
import { View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './HistoryScreen.styles';

export function HistoryScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text variant="title" style={styles.title}>
        Historique
      </Text>
      <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
        Aucune balade enregistrée pour l'instant.
      </Text>
    </View>
  );
}
