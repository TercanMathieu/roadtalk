import { StyleSheet } from 'react-native';

import { colors } from '../../ui';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceChip,
  },
  iconRide: {
    backgroundColor: 'rgba(255, 122, 26, 0.12)',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
  },
  launchButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceChip,
  },
  pressed: {
    opacity: 0.85,
  },
});
