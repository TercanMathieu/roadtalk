import { StyleSheet } from 'react-native';

import { colors, spacing } from './tokens';

export const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRow,
    borderRadius: 10,
    padding: 3,
  },
  option: {
    minWidth: 48,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
  },
  optionActive: {
    backgroundColor: colors.surfaceMuted,
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionLabel: {
    fontSize: 13,
  },
});
