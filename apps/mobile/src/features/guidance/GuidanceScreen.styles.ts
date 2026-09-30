import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_TARGET_DP, spacing } from '../../ui';

// Cibles tactiles portées à 76dp sur cet écran (au-delà du minimum 64dp du
// reste de l'app) : Figma les dimensionne pour de très gros gants, cohérent
// avec C2 — le guidage est l'écran le plus exposé à un appui à l'aveugle.
const GUIDANCE_TOUCH_TARGET_DP = 76;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: MIN_TOUCH_TARGET_DP,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(17, 19, 23, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    letterSpacing: -0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockBannerWrapper: {
    padding: spacing.sm,
  },
  instructionBar: {
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceChip,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  turnIcon: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionTexts: {
    flexShrink: 1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  roadRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  dangerAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.dangerSolid,
  },
  dangerAlertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  corridor: {
    flex: 1,
    backgroundColor: colors.background,
  },
  positionCursorWrapper: {
    position: 'absolute',
    bottom: 40,
    left: '50%',
    marginLeft: -32,
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    height: 64,
  },
  positionCursorGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 122, 26, 0.2)',
  },
  positionCursor: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingButtons: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    gap: spacing.md,
  },
  floatingButton: {
    width: GUIDANCE_TOUCH_TARGET_DP,
    height: GUIDANCE_TOUCH_TARGET_DP,
    borderRadius: 16,
    backgroundColor: colors.surfaceChip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassBadge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(40, 42, 45, 0.9)',
  },
  telemetryBar: {
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceChip,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  speedGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  speedUnitColumn: {
    gap: 2,
  },
  speedLimitSign: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedLimitSignInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
  },
  tripDataColumn: {
    gap: 2,
  },
  tripDataColumnCenter: {
    gap: 2,
    alignItems: 'center',
  },
  tripDataColumnEnd: {
    gap: 2,
    alignItems: 'flex-end',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: GUIDANCE_TOUCH_TARGET_DP,
    borderRadius: 12,
  },
  signalButton: {
    backgroundColor: colors.dangerSolid,
  },
  pauseButton: {
    backgroundColor: colors.surfaceRaised,
  },
});
