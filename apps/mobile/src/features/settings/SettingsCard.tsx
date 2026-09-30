import type React from 'react';
import { View } from 'react-native';

import { styles } from './SettingsCard.styles';

interface Props {
  readonly children: React.ReactNode;
}

// Conteneur d'une section : coins arrondis qui rognent proprement les lignes
// empilées (SettingsRow) sans que chacune ait à gérer son propre rayon.
export function SettingsCard({ children }: Props): React.JSX.Element {
  return <View style={styles.card}>{children}</View>;
}
