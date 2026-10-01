import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  // Section 2 (cache) et 3 (RGPD) : contenu hétérogène espacé, contrairement
  // à SettingsCard qui empile des lignes identiques sans espace entre elles.
  looseCard: {
    width: '100%',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  staticBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  // Pour une ligne dont le contrôle réel (Toggle) est accompagné d'un
  // <MockTag /> : empilés et alignés à droite, sous la même cible visuelle.
  rowTrailing: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surfaceRow,
  },
  identityIconSquare: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityTexts: {
    flexShrink: 1,
    gap: 2,
  },
  identityParagraph: {
    textTransform: 'none',
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 64,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceChip,
  },
  exportRowPressed: {
    opacity: 0.85,
  },
  exportRowLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
    paddingRight: spacing.sm,
  },
  exportRowTexts: {
    flexShrink: 1,
    gap: 2,
  },
});
