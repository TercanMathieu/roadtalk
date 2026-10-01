import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

// Sous le plancher standard de l'app (64dp) : décision explicite de
// l'utilisateur pour cet écran, qui accepte le compromis sur la précision au
// doigt ganté en roulant (C2) en échange d'un bandeau moins massif.
const ACTION_BUTTON_HEIGHT = 48;

export const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  offRouteNotice: {
    textAlign: 'center',
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  speedValue: {
    fontSize: 32,
  },
  speedLabels: {
    paddingBottom: 2,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
  },
  telemetryItem: {
    flex: 1,
    gap: 1,
  },
  telemetryItemEnd: {
    alignItems: 'flex-end',
  },
  telemetryValue: {
    fontSize: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  signalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: ACTION_BUTTON_HEIGHT,
    borderRadius: 8,
    backgroundColor: colors.dangerSolid,
  },
  menuButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    height: ACTION_BUTTON_HEIGHT,
    borderRadius: 8,
    backgroundColor: colors.surfaceRaised,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
});
