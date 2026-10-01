import { StyleSheet } from 'react-native';

import { colors, spacing } from './tokens';

export const styles = StyleSheet.create({
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceChip,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
