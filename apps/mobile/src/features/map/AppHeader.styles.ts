import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const APP_HEADER_HEIGHT = 48;

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: 'rgba(11, 13, 16, 0.92)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    height: APP_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  brandText: {
    fontSize: 16,
    letterSpacing: 0.5,
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  gpsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  avatarInitial: {
    fontSize: 13,
    color: colors.onAccentLight,
  },
});
