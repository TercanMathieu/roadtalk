import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: 12,
    gap: 12,
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
    gap: 6,
    paddingHorizontal: 12,
    minHeight: 36,
    borderRadius: 9999,
    backgroundColor: colors.surfaceChip,
  },
  tabs: {
    alignSelf: 'flex-start',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: 12,
  },
  listHeaderSection: {
    gap: 12,
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
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
  friendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    borderRadius: 9999,
    backgroundColor: colors.surfaceChip,
  },
  pressed: {
    opacity: 0.85,
  },
});
