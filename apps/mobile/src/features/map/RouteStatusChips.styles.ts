import { StyleSheet } from 'react-native';

import { colors } from '../../ui';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 9999,
    backgroundColor: colors.surfaceChip,
  },
  pressed: {
    opacity: 0.85,
  },
});
