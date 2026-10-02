import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  permissionBanner: {
    position: 'absolute',
    // En bas : le haut de l'écran est occupé par la barre de recherche.
    bottom: spacing.lg,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: spacing.sm,
    padding: spacing.md,
  },
  // Plein bord (pas de marge latérale) : le lecteur de manœuvre cockpit
  // occupe toute la largeur, contrairement au reste des overlays de l'écran
  // de préparation.
  maneuverBannerWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headingBadgeWrapper: {
    position: 'absolute',
    left: spacing.md,
  },
  guidanceMapButtons: {
    position: 'absolute',
    right: spacing.md,
    gap: spacing.md,
  },
  routeStatusChipsWrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
  // Invisible : capte le premier toucher hors de la barre de recherche pour
  // refermer son panneau (résultats/historique), sans rien faire d'autre —
  // le toucher suivant au même endroit agit normalement.
  searchDismissOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  snackbarWrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
});
