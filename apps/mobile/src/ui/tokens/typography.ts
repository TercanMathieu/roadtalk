import type { TextStyle } from 'react-native';

/**
 * La hiérarchie se fait par la taille, pas par la couleur seule (section 8).
 * "display" est dimensionné pour la vitesse/distance en écran de guidage
 * (session 10) — posé maintenant pour ne pas avoir à retoucher l'échelle.
 */
export const typography = {
  display: {
    fontSize: 56,
    fontWeight: '700',
    letterSpacing: -1,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
  },
  body: {
    fontSize: 17,
    fontWeight: '400',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
