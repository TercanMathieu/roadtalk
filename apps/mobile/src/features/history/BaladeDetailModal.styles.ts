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
    fontSize: 10,
  },
  name: {
    fontSize: 20,
    marginTop: spacing.xs,
  },
  dateLabel: {
    fontSize: 12,
  },
  mapWrapper: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceChip,
  },
  mapOverlayBadge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(11, 13, 16, 0.85)',
  },
  mapOverlayLabel: {
    fontSize: 10,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statTile: {
    flexBasis: '30%',
    flexGrow: 1,
    gap: 1,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.surfaceChip,
  },
  statLabel: {
    fontSize: 10,
  },
  statValue: {
    fontSize: 15,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  primaryButtonLabel: {
    fontSize: 13,
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.xs,
  },
  secondaryButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colors.surfaceChip,
  },
  pressed: {
    opacity: 0.85,
  },
});
