import type React from 'react';
import { View } from 'react-native';

import { styles } from './MockTag.styles';
import { Text } from './Text';
import { colors } from './tokens';

// Étiquette compacte pour une fonction pas encore construite au sein d'un
// écran par ailleurs réel (ex. une ligne de SettingsRow) — pendant discret
// de <MockBanner />. Neutre, pas rouge : le rouge est réservé aux alertes.
export function MockTag(): React.JSX.Element {
  return (
    <View style={styles.tag}>
      <Text variant="caption" color={colors.textSecondary}>
        Bientôt
      </Text>
    </View>
  );
}
