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
  // Ajoutés pour l'esthétique "cockpit" (écran Réglages) : une échelle
  // d'élévation à plusieurs niveaux plutôt qu'une seule surface, et un texte
  // secondaire plus clair adapté à de la lecture dense. Additifs, ne
  // remplacent aucune valeur existante ailleurs dans l'app.
  accentLight: '#FFB68E',
  onAccentLight: '#542200',
  surfaceRaised: '#1E2023',
  surfaceRow: '#1A1C1F',
  surfaceChip: '#282A2D',
  surfaceMuted: '#333538',
  textDense: '#C5C6CC',
  dangerContainer: 'rgba(147, 0, 10, 0.2)',
  onDangerContainer: '#FFB4AB',
  // Plein (pas translucide) : alerte haute priorité type bouton d'urgence
  // en guidage — dangerContainer reste le bon choix pour une action
  // destructive au repos (Réglages).
  dangerSolid: '#93000A',
  onDangerSolid: '#FFDAD6',
} as const;
