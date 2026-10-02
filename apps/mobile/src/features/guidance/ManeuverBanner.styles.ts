import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  iconSquare: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: colors.surfaceChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  distanceValue: {
    fontSize: 38,
    lineHeight: 42,
  },
  distanceUnit: {
    fontSize: 20,
  },
  directionLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusDetail: {
    fontSize: 14,
  },
  statusTitle: {
    fontSize: 24,
  },
  thenChip: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.surfaceChip,
  },
});
