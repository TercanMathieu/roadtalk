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
  // Libellés secondaires (légendes, unités, statuts) : même police système
  // que le reste, en casse normale. L'ancien registre monospace en capitales
  // rendait chaque écran dense et criard (préférence explicite du
  // 2026-10-01 : interface épurée, l'info ne doit jamais agresser).
  caption: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  // Variante appuyée : valeurs chiffrées, pastilles, libellés de bouton.
  // Chiffres tabulaires pour que distance/durée/vitesse ne dansent pas
  // quand la valeur change — taille à surcharger via `style` au besoin.
  captionStrong: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
