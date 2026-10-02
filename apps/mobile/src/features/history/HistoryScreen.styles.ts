import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  gpxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    minHeight: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceChip,
  },
  gpxButtonLabel: {
    fontSize: 11,
  },
  tabs: {
    alignSelf: 'flex-start',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  listHeaderSection: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sectionLabel: {
    fontSize: 11,
  },
  sectionSort: {
    fontSize: 10,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerContainer,
  },
  offlineBannerText: {
    flex: 1,
    fontSize: 11,
  },
  snackbarWrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.surfaceRow,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTexts: {
    flex: 1,
    gap: 2,
  },
  cardTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: 2,
  },
  cardTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: colors.surfaceChip,
  },
  cardTagRide: {
    backgroundColor: colors.accent,
  },
  cardTagRoute: {
    backgroundColor: colors.surfaceMuted,
  },
  cardTagLabel: {
    fontSize: 9,
  },
  cardName: {
    fontSize: 15,
  },
  cardDate: {
    fontSize: 11,
  },
  cardStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 2,
  },
  cardStat: {
    fontSize: 12,
  },
  cardActions: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  cardStatsCompact: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  launchButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  pressed: {
    opacity: 0.85,
  },
});
