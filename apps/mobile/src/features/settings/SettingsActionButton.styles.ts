import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_TARGET_DP, spacing } from '../../ui';

export const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET_DP,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    width: '100%',
  },
  default: {
    backgroundColor: colors.surfaceChip,
  },
  danger: {
    backgroundColor: colors.dangerContainer,
  },
  pressed: {
    opacity: 0.85,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
});
