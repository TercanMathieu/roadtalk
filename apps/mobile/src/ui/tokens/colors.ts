/**
 * Palette sombre uniquement pour l'instant (le mode jour très haute
 * luminosité — section 8 du brief — est un chantier à part entière,
 * pas une simple inversion de couleurs : on ne l'improvise pas ici).
 *
 * Une seule couleur d'accent pour l'action. Le rouge est réservé aux
 * alertes, jamais utilisé de façon décorative.
 */
export const colors = {
  background: '#0B0D10',
  surface: '#15181C',
  border: '#262B31',
  textPrimary: '#F5F5F5',
  textSecondary: '#9AA1A9',
  accent: '#FF7A1A',
  danger: '#FF3B30',
} as const;
