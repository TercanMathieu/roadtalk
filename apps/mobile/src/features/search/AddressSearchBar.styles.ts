import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_TARGET_DP, spacing } from '../../ui';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  searchColumn: {
    flex: 1,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET_DP,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.sm,
    backgroundColor: colors.surfaceChip,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
  },
  clearButton: {
    minWidth: MIN_TOUCH_TARGET_DP,
    minHeight: MIN_TOUCH_TARGET_DP,
    alignItems: 'center',
    justifyContent: 'center',
    // Compense le padding de la barre pour que la cible tactile déborde
    // jusqu'au bord plutôt que de rajouter à la largeur totale.
    marginVertical: -spacing.sm,
    marginRight: -spacing.md,
  },
  // Pas de cible 64dp ici (contrairement à clearButton) : accessoire
  // secondaire de la barre de recherche, pas une action de sécurité — voir
  // la consigne du Figma lui-même, qui ne marque "Glove Safe" que les
  // actions importantes (voir Réglages). La taille suit le design tel quel,
  // un hitSlop compense pour rester confortable au doigt.
  voiceButton: {
    width: 32,
    height: 40,
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  gpxButton: {
    width: MIN_TOUCH_TARGET_DP,
    height: MIN_TOUCH_TARGET_DP,
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceChip,
  },
  panel: {
    marginTop: spacing.sm,
    borderRadius: spacing.sm,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRow,
  },
  message: {
    padding: spacing.md,
  },
  suggestion: {
    minHeight: MIN_TOUCH_TARGET_DP,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historySuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  historyText: {
    flex: 1,
  },
  firstSuggestion: {
    borderTopWidth: 0,
  },
  suggestionPressed: {
    backgroundColor: colors.background,
  },
  suggestionContext: {
    marginTop: 2,
  },
});
