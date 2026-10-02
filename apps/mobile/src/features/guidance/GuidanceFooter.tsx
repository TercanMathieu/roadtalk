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

const ICON_SIZE = 16;

interface Props {
  readonly speedMps: number | undefined;
  // Limitation du tronçon en cours — undefined quand elle est inconnue :
  // aucun panneau affiché plutôt qu'une valeur supposée.
  readonly speedLimitMps: number | undefined;
  readonly distanceRemainingMeters: number;
  readonly durationRemainingSeconds: number;
  // Détection seule (voir route-progress.ts, OFF_ROUTE_THRESHOLD_METERS) —
  // pas de recalcul automatique de trajet, laissé à une itération future.
  readonly isOffRoute: boolean;
  // Ouvre le menu cockpit (DirectionsSheet, qui porte aussi "Quitter le
  // guidage" — pas de bouton Quitter séparé ici, voir ce composant).
  readonly onOpenMenu: () => void;
  // Alerte d'autres motards : hors périmètre V1 (détection de chute/SOS,
  // voir CLAUDE.md) — signale juste l'indisponibilité (Snackbar côté
  // MapScreen), jamais une vraie alerte envoyée.
  readonly onSignalPress: () => void;
}

// Bandeau cockpit (DA section 8, densité d'info décidée explicitement par
// l'utilisateur au-delà de la règle "3 infos max" par défaut) : vitesse
// réelle, télémétrie du trajet, actions dimensionnées pour les gants.
export function GuidanceFooter({
  speedMps,
  speedLimitMps,
  distanceRemainingMeters,
  durationRemainingSeconds,
  isOffRoute,
  onOpenMenu,
  onSignalPress,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const isSpeeding = isOverSpeedLimit(speedMps, speedLimitMps);

  return (
    <View style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}>
      {isOffRoute ? (
        <Text variant="label" color={colors.danger} style={styles.offRouteNotice}>
          Hors itinéraire
        </Text>
      ) : null}

      <View style={styles.speedRow}>
        <Text
          variant="display"
          tabularNums
          color={isSpeeding ? colors.danger : colors.textPrimary}
          style={styles.speedValue}
        >
          {formatSpeedKmh(speedMps)}
        </Text>
        <Text variant="monoBold" color={colors.textDense}>
          KM/H
        </Text>
        {speedLimitMps !== undefined ? (
          <View
            accessible
            accessibilityLabel={`Limitation ${formatSpeedLimitKmh(speedLimitMps)} kilomètres par heure`}
            style={[styles.speedLimitSign, isSpeeding ? styles.speedLimitSignExceeded : null]}
          >
            <Text variant="monoBold" tabularNums color={colors.textPrimary} style={styles.speedLimitValue}>
              {formatSpeedLimitKmh(speedLimitMps)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.telemetryRow}>
        <View style={styles.telemetryItem}>
          <Text variant="mono" color={colors.textDense}>
            TEMPS RESTANT
          </Text>
          <Text variant="title" tabularNums style={styles.telemetryValue}>
            {formatDuration(durationRemainingSeconds)}
          </Text>
        </View>
        <View style={styles.telemetryItem}>
          <Text variant="mono" color={colors.textDense}>
            DISTANCE
          </Text>
          <Text variant="title" tabularNums style={styles.telemetryValue}>
            {formatDistanceKm(distanceRemainingMeters)}
          </Text>
        </View>
        <View style={[styles.telemetryItem, styles.telemetryItemEnd]}>
          <Text variant="mono" color={colors.textDense}>
            ARRIVÉE
          </Text>
          <Text variant="title" color={colors.accent} tabularNums style={styles.telemetryValue}>
            {formatArrivalTime(durationRemainingSeconds)}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Signaler un problème aux autres motards"
          onPress={onSignalPress}
          style={({ pressed }) => [styles.signalButton, pressed ? styles.actionPressed : null]}
        >
          <MaterialCommunityIcons name="alert" size={ICON_SIZE} color={colors.onDangerSolid} />
          <Text variant="title" color={colors.onDangerSolid} style={styles.actionLabel}>
            SIGNAL
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Menu cockpit"
          onPress={onOpenMenu}
          style={({ pressed }) => [styles.menuButton, pressed ? styles.actionPressed : null]}
        >
          <MaterialCommunityIcons name="menu" size={ICON_SIZE} color={colors.textPrimary} />
          <Text variant="title" style={styles.actionLabel}>
            MENU
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
