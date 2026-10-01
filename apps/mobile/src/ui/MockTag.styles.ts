import { StyleSheet } from 'react-native';

import { colors, spacing } from './tokens';

export const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.danger,
  },
});
