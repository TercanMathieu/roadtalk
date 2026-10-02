import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRow,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  header: {
    padding: spacing.sm,
    gap: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  badgeLabel: {
    fontSize: 10,
  },
  dateLabel: {
    fontSize: 11,
  },
  name: {
    fontSize: 17,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
  },
  mapWrapper: {
    height: 160,
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
    backgroundColor: colors.surfaceChip,
    paddingVertical: spacing.sm,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
  statLabel: {
    fontSize: 10,
  },
  statValue: {
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  relaunchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  relaunchLabel: {
    fontSize: 13,
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
