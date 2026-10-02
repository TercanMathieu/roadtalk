import { StyleSheet } from 'react-native';

import { spacing } from '../../ui';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 60,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
    paddingRight: spacing.sm,
  },
  iconSquare: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flexShrink: 1,
    gap: 2,
  },
});
