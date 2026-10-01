import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { View } from 'react-native';

import { styles } from './Snackbar.styles';
import { Text } from './Text';
import { colors } from './tokens';

interface Props {
  readonly message: string | undefined;
}

export function Snackbar({ message }: Props): React.JSX.Element | null {
  if (message === undefined) {
    return null;
  }

  return (
    <View style={styles.snackbar}>
      <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.textPrimary} />
      <Text variant="body">{message}</Text>
    </View>
  );
}
