import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_TARGET_DP, spacing } from '../../ui';

export const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.lg,
    width: MIN_TOUCH_TARGET_DP,
    height: MIN_TOUCH_TARGET_DP,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MIN_TOUCH_TARGET_DP / 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    backgroundColor: colors.background,
  },
});
