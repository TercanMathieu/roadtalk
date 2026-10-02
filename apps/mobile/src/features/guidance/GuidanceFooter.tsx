import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, Text } from '../../ui';
import {
  formatArrivalTime,
  formatDistanceKm,
  formatDuration,
  formatSpeedKmh,
  formatSpeedLimitKmh,
  isOverSpeedLimit,
} from '../routing/format';
import { styles } from './GuidanceFooter.styles';

const ICON_SIZE = 22;

interface Props {
  readonly speedMps: number | undefined;
  // Limitation du tronçon en cours — undefined quand elle est inconnue :
  // aucun panneau affiché plutôt qu'une valeur supposée.
  readonly speedLimitMps: number | undefined;
  readonly distanceRemainingMeters: number;
  readonly durationRemainingSeconds: number;
  // Ouvre le menu cockpit (DirectionsSheet, qui porte aussi "Quitter le
  // guidage" — pas de bouton Quitter séparé ici, voir ce composant).
  readonly onOpenMenu: () => void;
}

// Une seule ligne, lue d'un coup d'œil : la vitesse (et la limitation) à
// gauche, l'heure d'arrivée à droite avec le reste à parcourir en dessous.
// Pas de bouton "Signal" : la fonction n'existe pas (hors périmètre V1), et
// un bouton rouge qui ne fait rien n'a pas sa place en roulant.
export function GuidanceFooter({
  speedMps,
  speedLimitMps,
  distanceRemainingMeters,
  durationRemainingSeconds,
  onOpenMenu,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const isSpeeding = isOverSpeedLimit(speedMps, speedLimitMps);

  return (
    <View style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}>
      <View style={styles.row}>
        <View style={styles.speedGroup}>
          <Text
            variant="display"
            tabularNums
            color={isSpeeding ? colors.danger : colors.textPrimary}
            style={styles.speedValue}
          >
            {formatSpeedKmh(speedMps)}
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            km/h
          </Text>
          {speedLimitMps !== undefined ? (
            <View
              accessible
              accessibilityLabel={`Limitation ${formatSpeedLimitKmh(speedLimitMps)} kilomètres par heure`}
              style={[styles.speedLimitSign, isSpeeding ? styles.speedLimitSignExceeded : null]}
            >
              <Text variant="captionStrong" tabularNums style={styles.speedLimitValue}>
                {formatSpeedLimitKmh(speedLimitMps)}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.tripGroup}>
          <Text variant="title" tabularNums style={styles.arrivalValue}>
            {formatArrivalTime(durationRemainingSeconds)}
          </Text>
          <Text variant="caption" color={colors.textSecondary} tabularNums>
            {`${formatDuration(durationRemainingSeconds)} · ${formatDistanceKm(distanceRemainingMeters)}`}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menu du guidage"
          onPress={onOpenMenu}
          style={({ pressed }) => [styles.menuButton, pressed ? styles.actionPressed : null]}
        >
          <MaterialCommunityIcons name="menu" size={ICON_SIZE} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}
