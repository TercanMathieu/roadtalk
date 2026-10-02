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
    alignItems: 'center',
    gap: spacing.xs,
  },
  speedValue: {
    fontSize: 32,
  },
  // Rond comme un panneau de limitation, mais cerclé en neutre : le rouge
  // reste réservé à l'alerte (dépassement), jamais porté en permanence.
  speedLimitSign: {
    marginLeft: 'auto',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedLimitSignExceeded: {
    borderColor: colors.danger,
  },
  speedLimitValue: {
    fontSize: 14,
    letterSpacing: 0,
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
