import { StyleSheet } from 'react-native';

import { colors, spacing } from '../../ui';

const DOT_SIZE = 10;

export const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  // Rail vertical : le point de l'étape, puis un trait qui descend jusqu'au
  // point suivant (sa hauteur suit celle de la ligne).
  rail: {
    width: DOT_SIZE,
    alignItems: 'center',
    paddingTop: 4,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.textSecondary,
  },
  // Arrêt intermédiaire : anneau vide, pour le distinguer du départ (plein,
  // neutre) et de l'arrivée (plein, accent).
  dotStop: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.textSecondary,
  },
  dotEnd: {
    backgroundColor: colors.accent,
  },
  connector: {
    flex: 1,
    width: 2,
    marginTop: 4,
    backgroundColor: colors.border,
  },
  texts: {
    flex: 1,
    gap: 2,
    paddingBottom: spacing.md,
  },
  textsLast: {
    paddingBottom: 0,
  },
});
