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
    minWidth: 54,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  optionActive: {
    backgroundColor: colors.accentLight,
  },
  optionLabel: {
    fontSize: 18,
  },
});
