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
  // Monospace, capitales, chasse large : registre "cockpit" (écran
  // Réglages) pour les libellés techniques/de statut — jamais pour du texte
  // de lecture courante. Nécessite la police JetBrainsMono_500Medium
  // chargée par RootLayout ; `fontFamily` absente tant qu'elle ne l'est
  // pas encore, RN retombe alors sur la police système sans erreur.
  mono: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  // Variante grasse du registre mono (badges, pastilles, libellés de bouton
  // d'action) — taille de repli 13px, à surcharger via `style` pour les
  // quelques tailles ponctuelles plus grandes (18/28px) plutôt que
  // multiplier les variantes nommées pour un usage à chaque fois différent.
  monoBold: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: 13,
    letterSpacing: 0.65,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
