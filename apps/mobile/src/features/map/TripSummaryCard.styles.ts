import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_TARGET_DP, spacing } from '../../ui';

export const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitleText: {
    fontSize: 20,
  },
  jalonsBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    backgroundColor: colors.surfaceRaised,
  },
  stepsList: {
    gap: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surfaceRow,
  },
  stepBadge: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  originBadge: {
    backgroundColor: colors.surfaceRaised,
  },
  terminusBadge: {
    backgroundColor: colors.accent,
  },
  stepTexts: {
    flex: 1,
    gap: 2,
  },
  closeButton: {
    minWidth: MIN_TOUCH_TARGET_DP,
    minHeight: MIN_TOUCH_TARGET_DP,
    alignItems: 'center',
    justifyContent: 'center',
    // Compense le padding de la ligne pour que la cible tactile déborde
    // jusqu'au bord plutôt que de rajouter à la largeur totale.
    marginVertical: -spacing.md,
    marginRight: -spacing.md,
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET_DP,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
  },
  addStopButtonPressed: {
    opacity: 0.85,
  },
  message: {
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontSize: 22,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET_DP,
    borderRadius: 12,
    backgroundColor: colors.accent,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonPressed: {
    opacity: 0.85,
  },
  startButtonLabel: {
    fontSize: 18,
    textTransform: 'uppercase',
  },
});
