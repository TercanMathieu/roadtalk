import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

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
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
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
    fontSize: 15,
  },
  clearButton: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    // Compense le padding de la barre pour que la cible tactile déborde
    // jusqu'au bord plutôt que de rajouter à la largeur totale.
    marginVertical: -spacing.sm,
    marginRight: -spacing.sm,
  },
  voiceButton: {
    width: 32,
    height: 36,
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
  },
  gpxButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
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
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  suggestionLabel: {
    fontSize: 14,
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
    marginTop: 1,
    fontSize: 11,
  },
});
