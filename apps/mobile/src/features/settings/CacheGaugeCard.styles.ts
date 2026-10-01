import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  card: {
    width: '100%',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surfaceRow,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sizeGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sizeValue: {
    fontSize: 28,
  },
  bar: {
    height: 12,
    borderRadius: 9999,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  breakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
