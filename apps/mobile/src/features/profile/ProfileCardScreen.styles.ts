import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surfaceChip,
  },
  rejectedText: {
    flex: 1,
    fontSize: 15,
  },
  // La fiche telle que les autres la verront : portrait, puis l'identifiant.
  card: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    maxWidth: '100%',
  },
  handleName: {
    flexShrink: 1,
    fontSize: 24,
  },
  handleTag: {
    fontSize: 20,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  field: {
    gap: spacing.sm,
  },
  fieldLabel: {
    paddingHorizontal: spacing.xs,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 17,
  },
  inputLocked: {
    color: colors.textSecondary,
  },
  fieldHint: {
    paddingHorizontal: spacing.xs,
  },
  redrawButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: colors.surfaceChip,
  },
  footer: {
    marginTop: 'auto',
    gap: spacing.sm,
  },
  saveError: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
