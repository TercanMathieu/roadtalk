import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_TARGET_DP, spacing } from '../../ui';

export const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  firstStopRow: {
    borderTopWidth: 0,
    paddingTop: 0,
    marginTop: 0,
  },
  stopLabel: {
    flex: 1,
  },
  closeButton: {
    minWidth: MIN_TOUCH_TARGET_DP,
    minHeight: MIN_TOUCH_TARGET_DP,
    alignItems: 'center',
    justifyContent: 'center',
    // Compense le padding de la carte pour que la cible tactile déborde
    // jusqu'au bord plutôt que de rajouter à la largeur totale.
    marginVertical: -spacing.sm,
    marginRight: -spacing.sm,
  },
  message: {
    marginTop: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  stat: {
    flex: 1,
  },
  statCaption: {
    marginTop: spacing.xs,
  },
  addStopHint: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
