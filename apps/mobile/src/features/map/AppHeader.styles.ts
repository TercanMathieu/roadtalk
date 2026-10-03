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
    // Opaque : en translucide, le contenu des onglets Balades/Cockpit se
    // lisait à travers en défilant et se mélangeait au titre.
    backgroundColor: colors.background,
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
    gap: 6,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  brandText: {
    fontSize: 17,
    letterSpacing: -0.2,
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
    backgroundColor: colors.surfaceChip,
  },
  // Demande d'ami reçue : un point d'accent, sans chiffre — l'écran Amis
  // donne le détail.
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.background,
    backgroundColor: colors.accent,
  },
  avatarInitial: {
    fontSize: 13,
    color: colors.textPrimary,
  },
});
