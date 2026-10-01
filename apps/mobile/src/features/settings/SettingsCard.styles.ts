import { StyleSheet } from 'react-native';

import { colors } from '../../ui';

export const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    gap: 2,
    backgroundColor: colors.surfaceRaised,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
