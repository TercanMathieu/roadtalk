import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
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
  label: {
    fontSize: 15,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
});
