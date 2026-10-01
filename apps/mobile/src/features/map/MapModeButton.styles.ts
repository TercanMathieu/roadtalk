import { StyleSheet } from 'react-native';

import { spacing } from '../../ui';
import { MAP_OVERLAY_BUTTON_SIZE } from './RecenterButton.styles';

export const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: spacing.md,
    width: MAP_OVERLAY_BUTTON_SIZE,
    height: MAP_OVERLAY_BUTTON_SIZE,
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
    backgroundColor: 'rgba(12, 14, 17, 0.9)',
  },
});
