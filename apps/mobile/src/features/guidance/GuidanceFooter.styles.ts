import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_TARGET_DP, spacing } from '../../ui';

export const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  handleRow: {
    alignItems: 'center',
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  offRouteNotice: {
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  speedBlock: {
    alignItems: 'flex-start',
  },
  infoBlock: {
    flex: 1,
    gap: 2,
  },
  infoSecondLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  exitButton: {
    width: MIN_TOUCH_TARGET_DP,
    height: MIN_TOUCH_TARGET_DP,
    borderRadius: MIN_TOUCH_TARGET_DP / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  exitButtonPressed: {
    backgroundColor: colors.border,
  },
});
