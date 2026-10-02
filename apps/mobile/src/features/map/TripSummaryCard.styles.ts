import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_TARGET_DP, spacing } from '../../ui';

export const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.background,
    padding: spacing.sm,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  // Zone de prise du swipe (cacher/réouvrir la feuille) — plus grande que le
  // trait visible lui-même pour rester facile à attraper.
  gripHandle: {
    alignItems: 'center',
    marginTop: -spacing.xs,
    marginHorizontal: -spacing.sm,
    paddingVertical: spacing.xs,
  },
  grip: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  // Invisible, sert uniquement à mesurer la hauteur réduite en continu (voir
  // TripSummaryCard) sans jamais être vue ni interceptée au toucher.
  measureProbe: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    opacity: 0,
  },
  // Pendant un drag actif : la hauteur réelle de ce conteneur est animée
  // (voir `animatedHeight`), le contenu complet est donc coupé par le bas au
  // fur et à mesure qu'il rétrécit plutôt que débordé.
  dragBody: {
    overflow: 'hidden',
  },
  collapsedLabel: {
    flex: 1,
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitleText: {
    fontSize: 15,
  },
  jalonsBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.surfaceRaised,
  },
  stepsList: {
    gap: spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceRow,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  originBadge: {
    backgroundColor: colors.surfaceRaised,
  },
  terminusBadge: {
    backgroundColor: colors.accent,
  },
  stepTexts: {
    flex: 1,
    gap: 1,
  },
  stepLabel: {
    fontSize: 11,
  },
  stepAddress: {
    fontSize: 14,
  },
  closeButton: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET_DP,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
  },
  addStopButtonPressed: {
    opacity: 0.85,
  },
  message: {
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: {
    alignItems: 'center',
    gap: 1,
  },
  statValue: {
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  startButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: colors.accent,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonPressed: {
    opacity: 0.85,
  },
  startButtonLabel: {
    fontSize: 14,
    textTransform: 'uppercase',
  },
  saveRouteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.surfaceRaised,
  },
  saveRouteButtonLabel: {
    fontSize: 12,
  },
});
