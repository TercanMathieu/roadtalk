import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    width: '100%',
    padding: spacing.xs,
    backgroundColor: colors.background,
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flexShrink: 1,
    gap: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  distanceValue: {
    fontSize: 30,
  },
  directionLabel: {
    fontSize: 14,
  },
});
