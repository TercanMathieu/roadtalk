import { StyleSheet } from 'react-native';

import { colors, MIN_TOUCH_TARGET_DP, spacing } from '../../ui';

export const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: 12,
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
    marginTop: -spacing.sm,
    marginHorizontal: -spacing.md,
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
    fontSize: 15,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  summaryDuration: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  summaryDetails: {
    flex: 1,
    fontSize: 15,
  },
  // Lignes sans fond ni bordure : la liste se lit comme un trajet, pas
  // comme un empilement de cartes. ROW_PITCH (ReorderableStepRow) dépend de
  // minHeight + gap — à ajuster ensemble.
  stepsList: {
    gap: 0,
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
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
    backgroundColor: colors.surfaceChip,
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
    fontSize: 15,
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
    gap: 12,
    minHeight: MIN_TOUCH_TARGET_DP,
  },
  addStopIcon: {
    width: 28,
    alignItems: 'center',
  },
  addStopButtonPressed: {
    opacity: 0.85,
  },
  message: {
    textAlign: 'center',
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
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  startButtonDisabled: {
    opacity: 0.4,
  },
  startButtonPressed: {
    opacity: 0.85,
  },
  startButtonLabel: {
    fontSize: 17,
  },
  saveRouteButton: {
    width: 52,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surfaceChip,
  },
});
