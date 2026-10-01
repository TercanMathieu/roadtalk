import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, Text } from '../../ui';
import { formatArrivalTime, formatDistanceKm, formatDuration, formatSpeedKmh } from '../routing/format';
import { styles } from './GuidanceFooter.styles';

const EXIT_ICON_SIZE = 26;
const EXPAND_ICON_SIZE = 16;

interface Props {
  readonly speedMps: number | undefined;
  readonly distanceRemainingMeters: number;
  readonly durationRemainingSeconds: number;
  // Détection seule (voir route-progress.ts, OFF_ROUTE_THRESHOLD_METERS) —
  // pas de recalcul automatique de trajet, laissé à une itération future.
  readonly isOffRoute: boolean;
  readonly onExit: () => void;
  // Ouvre le récapitulatif détaillé de toutes les manœuvres (DirectionsSheet).
  readonly onExpandDirections: () => void;
}

// Écran de guidage (DA section 8) : condensé pour rester une bande fine, la
// carte doit dominer l'écran. "Quitter" est un rond icône seule (cible ≥
// 64dp, C2) plutôt qu'un bouton pleine largeur. Le bloc distance/durée est
// lui-même la cible pour ouvrir le récapitulatif détaillé — pas de ligne
// supplémentaire seulement pour ça.
export function GuidanceFooter({
  speedMps,
  distanceRemainingMeters,
  durationRemainingSeconds,
  isOffRoute,
  onExit,
  onExpandDirections,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.footer, { paddingBottom: spacing.sm + insets.bottom }]}>
      <View style={styles.handleRow}>
        <View style={styles.handle} />
      </View>

      {isOffRoute ? (
        <Text variant="label" color={colors.danger} style={styles.offRouteNotice}>
          Hors itinéraire
        </Text>
      ) : null}

      <View style={styles.row}>
        <View style={styles.speedBlock}>
          <Text variant="display" tabularNums>
            {formatSpeedKmh(speedMps)}
          </Text>
          <Text variant="label" color={colors.textSecondary}>
            km/h
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voir toutes les étapes de l'itinéraire"
          onPress={onExpandDirections}
          style={styles.infoBlock}
        >
          <Text variant="body" tabularNums numberOfLines={1}>
            {formatDistanceKm(distanceRemainingMeters)} restants
          </Text>
          <View style={styles.infoSecondLine}>
            <Text variant="label" color={colors.textSecondary} tabularNums numberOfLines={1}>
              {formatDuration(durationRemainingSeconds)} · arrivée {formatArrivalTime(durationRemainingSeconds)}
            </Text>
            <MaterialCommunityIcons name="chevron-up" size={EXPAND_ICON_SIZE} color={colors.textSecondary} />
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quitter le guidage"
          onPress={onExit}
          style={({ pressed }) => [styles.exitButton, pressed ? styles.exitButtonPressed : null]}
        >
          <MaterialCommunityIcons name="close" size={EXIT_ICON_SIZE} color={colors.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}
