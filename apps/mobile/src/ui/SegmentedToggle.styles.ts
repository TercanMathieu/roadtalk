import { StyleSheet } from 'react-native';

import { colors, spacing } from './tokens';

export const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    padding: spacing.xs,
  },
  option: {
    minWidth: 48,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  optionActive: {
    backgroundColor: colors.accentLight,
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionLabel: {
    fontSize: 11,
  },
});
