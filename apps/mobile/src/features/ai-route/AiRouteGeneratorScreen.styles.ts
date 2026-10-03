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
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: MIN_TOUCH_TARGET_DP,
    height: MIN_TOUCH_TARGET_DP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    paddingHorizontal: spacing.xs,
  },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  optionGroup: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  option: {
    flex: 1,
    minHeight: MIN_TOUCH_TARGET_DP,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  optionActive: {
    backgroundColor: colors.surfaceMuted,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceChip,
  },
  stepperValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: colors.surfaceChip,
  },
  // Sélection par teinte légère de l'accent, pas par un aplat : plusieurs
  // puces peuvent être actives à la fois sans concurrencer le bouton Générer.
  chipActive: {
    backgroundColor: 'rgba(255, 122, 26, 0.14)',
  },
  listCard: {
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 60,
    paddingHorizontal: spacing.md,
  },
  listRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  listRowLabel: {
    flexShrink: 1,
  },
  notesInput: {
    minHeight: 88,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  generateButtonLabel: {
    fontSize: 17,
  },
  pressed: {
    opacity: 0.85,
  },
});
