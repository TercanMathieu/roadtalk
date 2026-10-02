import { StyleSheet } from 'react-native';

import { colors, spacing } from './tokens';

export const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceChip,
  },
  text: {
    flexShrink: 1,
  },
});
