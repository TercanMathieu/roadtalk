import type React from 'react';
import { View } from 'react-native';

import { styles } from './MockTag.styles';
import { Text } from './Text';
import { colors } from './tokens';

// Étiquette compacte pour une valeur isolée fictive au sein d'un écran par
// ailleurs réel (ex. une ligne de SettingsRow) — pendant discret de
// <MockBanner />, pensé pour ne pas casser une mise en page dense.
export function MockTag(): React.JSX.Element {
  return (
    <View style={styles.tag}>
      <Text variant="label" color={colors.danger}>
        FICTIF
      </Text>
    </View>
  );
}
