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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: MIN_TOUCH_TARGET_DP,
    height: MIN_TOUCH_TARGET_DP,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -spacing.sm,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 22,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    // Neutre : une colonne entière de pastilles en couleur d'accent noyait
    // la seule vraie action de l'écran (quitter le guidage).
    backgroundColor: colors.surfaceChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  exitSection: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET_DP,
    borderRadius: 14,
    // Plein (pas dangerContainer, translucide) : action du menu de guidage,
    // pas un réglage au repos.
    backgroundColor: colors.dangerSolid,
  },
  exitButtonPressed: {
    opacity: 0.85,
  },
  exitButtonLabel: {
    fontSize: 17,
  },
});
