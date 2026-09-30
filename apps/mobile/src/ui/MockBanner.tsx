import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { View } from 'react-native';

import { styles } from './MockBanner.styles';
import { Text } from './Text';
import { colors } from './tokens';

interface Props {
  // Par défaut : la formulation générique utilisée sur tous les écrans
  // maquette. Personnalisable si un écran a besoin d'être plus précis sur
  // ce qui manque encore (ex. "en attente du moteur de guidage").
  readonly message?: string;
}

const DEFAULT_MESSAGE =
  "Aperçu visuel — données fictives, fonctionnalité pas encore branchée.";

// Marqueur systématique de tout écran (ou section d'écran) dont le contenu
// est un aperçu du design plutôt qu'une donnée réelle — bande rouge à
// gauche, toujours en haut de ce qu'elle couvre, jamais mélangée à une
// donnée réelle sans marqueur (voir aussi <MockTag /> pour une valeur isolée
// au sein d'un écran par ailleurs réel).
export function MockBanner({ message = DEFAULT_MESSAGE }: Props): React.JSX.Element {
  return (
    <View style={styles.banner}>
      <MaterialCommunityIcons name="flask-outline" size={18} color={colors.danger} />
      <Text variant="label" color={colors.danger} style={styles.text}>
        {message}
      </Text>
    </View>
  );
}
