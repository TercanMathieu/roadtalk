import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  header: {
    padding: spacing.md,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flexShrink: 1,
    fontSize: 20,
  },
  // Même hauteur que RideTrackMap (192, imposée par le composant) : plus
  // basse, la carte débordait sur la ligne de statistiques en dessous. La
  // place est réservée même avant l'arrivée du tracé, pour que la liste ne
  // saute pas quand il se charge.
  mapWrapper: {
    height: 192,
    overflow: 'hidden',
    backgroundColor: colors.surfaceChip,
  },
  statsRow: {
    flexDirection: 'row',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  statLabel: {
    fontSize: 11,
  },
  statValue: {
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  launchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  launchLabel: {
    fontSize: 15,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.surfaceChip,
  },
  pressed: {
    opacity: 0.85,
  },
});
