import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_TARGET_DP, spacing } from '../../ui';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    textTransform: 'uppercase',
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: colors.surfaceChip,
  },
  modelBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  modelBadgeLabel: {
    fontSize: 11,
  },
  tripTypeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: 6,
    borderRadius: 12,
    backgroundColor: colors.surfaceRow,
  },
  tripTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET_DP,
    borderRadius: 8,
  },
  tripTypeButtonActive: {
    backgroundColor: colors.surfaceMuted,
  },
  tripTypeLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceRow,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  cardHeaderLabel: {
    fontSize: 16,
    textTransform: 'uppercase',
  },
  levelBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  sinuosityButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  sinuosityButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    borderRadius: 4,
    backgroundColor: colors.surfaceRaised,
  },
  sinuosityButtonActive: {
    backgroundColor: colors.accent,
  },
  sinuosityCaption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  durationPresets: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationPresetButton: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minHeight: 52,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
  },
  durationPresetButtonActive: {
    backgroundColor: colors.accent,
  },
  durationPresetValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  fineTuneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
  },
  fineTuneButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.surfaceChip,
  },
  fineTuneTexts: {
    alignItems: 'center',
    gap: 2,
  },
  fineTuneValue: {
    fontSize: 22,
  },
  criteriaList: {
    gap: spacing.sm,
  },
  criterionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
  },
  criterionTexts: {
    flex: 1,
    gap: 2,
  },
  poiHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  poiCount: {
    textAlign: 'right',
  },
  poiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
  },
  poiCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  poiCheckboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  poiCheckboxUnchecked: {
    borderColor: colors.textDense,
  },
  poiLabel: {
    flex: 1,
  },
  promptRow: {
    position: 'relative',
  },
  promptInput: {
    minHeight: 56,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
    color: colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: 56,
  },
  promptVoiceButton: {
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceChip,
  },
  offlineInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET_DP,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  generateButtonPressed: {
    opacity: 0.85,
  },
  generateButtonLabel: {
    fontSize: 18,
    textTransform: 'uppercase',
  },
  snackbarWrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
});
