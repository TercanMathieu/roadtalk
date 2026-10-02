import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: spacing.md,
    maxWidth: '70%',
    backgroundColor: 'rgba(21, 24, 28, 0.92)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  title: {
    fontSize: 15,
  },
  subtitle: {
    fontSize: 10,
    marginTop: 2,
  },
});
