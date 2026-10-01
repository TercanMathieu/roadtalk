import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

export const MAP_OVERLAY_BUTTON_SIZE = 48;
const BUTTON_SIZE = MAP_OVERLAY_BUTTON_SIZE;

export const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.lg,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(40, 42, 45, 0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pressed: {
    backgroundColor: colors.background,
  },
});
