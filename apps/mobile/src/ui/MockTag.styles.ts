import { StyleSheet } from 'react-native';

import { colors, spacing } from './tokens';

export const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: colors.surfaceMuted,
  },
});
