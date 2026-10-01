import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 72,
    padding: spacing.md,
    backgroundColor: colors.surfaceRow,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flexShrink: 1,
    paddingRight: spacing.sm,
  },
  iconSquare: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flexShrink: 1,
    gap: 2,
  },
});
