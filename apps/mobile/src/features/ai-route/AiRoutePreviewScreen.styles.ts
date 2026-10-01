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
  iaBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 9999,
    backgroundColor: colors.surfaceChip,
    alignSelf: 'flex-start',
  },
  iaBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  // Pas de vraie carte ni de photo (voir commentaire du composant) : panneau
  // neutre qui reprend la même composition que le Figma sans prétendre
  // montrer un lieu réel.
  previewPanel: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRow,
    padding: spacing.md,
  },
  previewPanelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewPanelTagTexts: {
    flex: 1,
    gap: 2,
  },
  previewPanelTitle: {
    fontWeight: '700',
  },
  previewPanelSurface: {
    alignItems: 'flex-end',
  },
  previewPanelSurfaceValue: {
    fontSize: 18,
  },
  titleSection: {
    gap: spacing.sm,
  },
  titleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recommendedTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  routeTitle: {
    fontSize: 22,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  metricTile: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surfaceRaised,
  },
  metricTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    textTransform: 'uppercase',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  metricValue: {
    fontSize: 24,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
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
  },
  cardHeaderLabel: {
    fontSize: 16,
  },
  elevationChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 3,
    height: 80,
  },
  elevationBar: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
  elevationAxis: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  highlightsList: {
    gap: spacing.sm,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceChip,
  },
  segmentsSection: {
    gap: spacing.sm,
  },
  segmentsLabel: {
    textTransform: 'uppercase',
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  segmentCard: {
    flex: 1,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.surfaceRow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentCardLabel: {
    textAlign: 'center',
  },
  waypointsList: {
    gap: 0,
  },
  waypointRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  waypointRail: {
    alignItems: 'center',
  },
  waypointDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceChip,
  },
  waypointDotEnd: {
    backgroundColor: colors.accentLight,
  },
  waypointConnector: {
    width: 2,
    flex: 1,
    minHeight: 32,
    marginTop: spacing.xs,
    backgroundColor: colors.border,
  },
  waypointTexts: {
    flex: 1,
    gap: 2,
    paddingBottom: spacing.md,
  },
  waypointHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  waypointTitle: {
    fontWeight: '700',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET_DP,
    borderRadius: 12,
    backgroundColor: colors.surfaceRow,
  },
  launchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 80,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  launchButtonPressed: {
    opacity: 0.9,
  },
  launchButtonTexts: {
    flex: 1,
    gap: 2,
  },
  launchButtonTitle: {
    fontSize: 20,
    textTransform: 'uppercase',
  },
  launchButtonCaption: {
    opacity: 0.9,
  },
  launchButtonDistance: {
    fontSize: 16,
    textAlign: 'center',
  },
  snackbarWrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
});
