import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_TARGET_DP, spacing } from '../../ui';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 22,
  },
  closeButton: {
    width: MIN_TOUCH_TARGET_DP,
    height: MIN_TOUCH_TARGET_DP,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  result: {
    justifyContent: 'center',
    gap: 2,
    minHeight: 52,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  message: {
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.6,
  },
});
