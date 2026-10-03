import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_TARGET_DP, spacing } from '../../ui';

const WAYPOINT_DOT_SIZE = 10;

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
  summary: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  routeTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  summaryDuration: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  summaryDetails: {
    fontSize: 15,
  },
  highlightsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  highlightChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: colors.surfaceChip,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    paddingHorizontal: spacing.xs,
  },
  card: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  elevationChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  elevationBar: {
    flex: 1,
    borderRadius: 3,
    backgroundColor: colors.surfaceMuted,
  },
  elevationBarPeak: {
    backgroundColor: colors.accent,
  },
  elevationAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  waypointRow: {
    flexDirection: 'row',
    gap: 12,
  },
  // Rail vertical : le point de l'étape, puis un trait qui descend jusqu'au
  // point suivant (la hauteur suit celle de la ligne, via alignSelf stretch).
  waypointRail: {
    width: WAYPOINT_DOT_SIZE,
    alignItems: 'center',
    paddingTop: 6,
  },
  waypointDot: {
    width: WAYPOINT_DOT_SIZE,
    height: WAYPOINT_DOT_SIZE,
    borderRadius: WAYPOINT_DOT_SIZE / 2,
    backgroundColor: colors.textSecondary,
  },
  waypointDotEnd: {
    backgroundColor: colors.accent,
  },
  waypointConnector: {
    flex: 1,
    width: 2,
    marginTop: 4,
    backgroundColor: colors.border,
  },
  waypointTexts: {
    flex: 1,
    gap: 2,
    paddingBottom: spacing.md,
  },
  waypointTextsLast: {
    paddingBottom: 0,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  launchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  launchButtonLabel: {
    fontSize: 17,
  },
  pressed: {
    opacity: 0.85,
  },
  snackbarWrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
});
