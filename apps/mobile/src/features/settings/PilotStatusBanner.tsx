import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './PilotStatusBanner.styles';

// Pas de numéro de version ni d'état "à l'arrêt/en mouvement" inventés : cet
// écran ne lit aucun capteur, la bannière ne doit affirmer que ce qu'on sait
// réellement (écran de préparation, session authentifiée).
export function PilotStatusBanner(): React.JSX.Element {
  return (
    <View style={styles.banner}>
      <View style={styles.leading}>
        <View style={styles.iconSquare}>
          <MaterialCommunityIcons name="motorbike" size={24} color={colors.textPrimary} />
        </View>
        <View>
          <View style={styles.titleRow}>
            <Text variant="title" style={styles.title}>
              Cockpit Moto
            </Text>
            <View style={styles.liveDot} />
          </View>
          <Text variant="mono" color={colors.textDense}>
            MODE PRÉPARATION
          </Text>
        </View>
      </View>
      <View style={styles.badge}>
        <MaterialCommunityIcons name="lock-outline" size={12} color={colors.textDense} />
        <Text variant="mono" color={colors.textDense}>
          SÉCURISÉ
        </Text>
      </View>
    </View>
  );
}
