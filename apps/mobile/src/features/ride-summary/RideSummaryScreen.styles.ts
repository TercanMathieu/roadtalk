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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 122, 26, 0.2)',
  },
  bannerTexts: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontSize: 22,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
  },
  gpsFixBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: 'rgba(12, 14, 17, 0.9)',
  },
  gpsFixDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  mapLegend: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(12, 14, 17, 0.85)',
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  titleSection: {
    gap: spacing.sm,
    padding: spacing.md,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    padding: 0,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statsSection: {
    gap: spacing.sm,
  },
  statsHeader: {
    paddingHorizontal: spacing.xs,
  },
  distanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
  },
  distanceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  distanceValue: {
    fontSize: 40,
  },
  distanceUnit: {
    fontSize: 16,
  },
  distanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statTile: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
  },
  statTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 22,
  },
  notesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
  },
  notesRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowPressed: {
    opacity: 0.85,
  },
  notesIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  notesTexts: {
    flex: 1,
    gap: 2,
  },
  photosButton: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET_DP,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  primaryActionDisabled: {
    opacity: 0.6,
  },
  primaryActionLabel: {
    fontSize: 18,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET_DP,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
  },
  secondaryActionLabel: {
    fontSize: 16,
  },
  snackbarWrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
});
