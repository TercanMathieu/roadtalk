import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.surfaceRow,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerLabel: {
    fontSize: 11,
  },
  mockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.surfaceChip,
  },
  mockBadgeLabel: {
    fontSize: 10,
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tile: {
    flex: 1,
    gap: 2,
    padding: spacing.xs,
    borderRadius: 8,
    backgroundColor: colors.surfaceChip,
  },
  tileLabel: {
    fontSize: 10,
  },
  tileValue: {
    fontSize: 18,
  },
  tileUnit: {
    fontSize: 10,
  },
});
