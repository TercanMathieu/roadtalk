import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    paddingTop: 12,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  speedGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  speedValue: {
    fontSize: 44,
    lineHeight: 48,
  },
  // Rond comme un panneau de limitation, mais cerclé en neutre : le rouge
  // reste réservé à l'alerte (dépassement), jamais porté en permanence.
  speedLimitSign: {
    alignSelf: 'center',
    marginLeft: spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedLimitSignExceeded: {
    borderColor: colors.danger,
  },
  speedLimitValue: {
    fontSize: 15,
  },
  tripGroup: {
    alignItems: 'flex-end',
    gap: 2,
  },
  arrivalValue: {
    fontSize: 24,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceChip,
  },
  actionPressed: {
    opacity: 0.85,
  },
});
