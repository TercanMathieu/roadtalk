import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  header: {
    gap: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeRide: {
    backgroundColor: colors.accent,
  },
  badgeRoute: {
    backgroundColor: colors.surfaceChip,
  },
  badgeLabel: {
    fontSize: 11,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  // Champ de saisie habillé comme un titre : le nom se modifie en touchant
  // dessus, le crayon à côté le signale.
  nameInput: {
    flex: 1,
    paddingVertical: spacing.xs,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
  },
  dateLabel: {
    fontSize: 12,
  },
  // Même hauteur que RideTrackMap (192, imposée par le composant) : plus
  // haute, une bande vide apparaissait sous la carte.
  mapWrapper: {
    height: 192,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surfaceChip,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statTile: {
    flexBasis: '30%',
    flexGrow: 1,
    gap: 2,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  statLabel: {
    fontSize: 11,
  },
  statValue: {
    fontSize: 17,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    paddingHorizontal: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.accent,
  },
  primaryButtonLabel: {
    fontSize: 17,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.surfaceChip,
  },
  secondaryButtonLabel: {
    fontSize: 15,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    marginTop: spacing.sm,
    borderRadius: 14,
    backgroundColor: colors.dangerContainer,
  },
  pressed: {
    opacity: 0.85,
  },
});
