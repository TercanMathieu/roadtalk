import type { ViewStyle } from 'react-native';

import { colors } from './colors';

// Valeur partagée entre app/(tabs)/_layout.tsx (style par défaut) et
// MapScreen (masquage pendant le guidage actif) — une seule source de
// vérité pour éviter que les deux dérivent l'une de l'autre.
export const TAB_BAR_HEIGHT = 72;

export const TAB_BAR_STYLE: ViewStyle = {
  backgroundColor: colors.surface,
  borderTopColor: colors.border,
  height: TAB_BAR_HEIGHT,
  paddingBottom: 12,
  paddingTop: 8,
};
