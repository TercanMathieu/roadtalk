import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './SettingsRow.styles';

interface Props {
  readonly icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  readonly title: string;
  readonly subtitle: string;
  // Repli sur textDense : accentLight signale un statut actif/positif
  // (ex. "intercom relié"), réservé aux lignes qui en ont un à montrer.
  readonly subtitleColor?: string;
  readonly children: React.ReactNode;
}

// Ligne générique d'une carte Réglages : icône, titre, sous-titre technique,
// et un contrôle de fin libre (badge, interrupteur, bouton…).
export function SettingsRow({
  icon,
  title,
  subtitle,
  subtitleColor,
  children,
}: Props): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.leading}>
        <View style={styles.iconSquare}>
          <MaterialCommunityIcons name={icon} size={20} color={colors.textPrimary} />
        </View>
        <View style={styles.texts}>
          <Text variant="body" numberOfLines={1}>
            {title}
          </Text>
          <Text variant="mono" color={subtitleColor ?? colors.textDense} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
      {children}
    </View>
  );
}
