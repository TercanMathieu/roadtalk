import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { RideListItemDto } from '@roadtalk/contracts';
import type React from 'react';
import { Pressable, View } from 'react-native';

import { colors, Text } from '../../ui';
import { formatElevationMeters, formatSpeedKmhValue } from '../ride-summary/format';
import { RideTrackMap } from '../ride-summary/RideTrackMap';
import type { TrackPoint } from '../ride-summary/track-point';
import { formatDistanceKm, formatDuration } from '../routing/format';
import { formatRideDate } from './format';
import { styles } from './LastRideHeroCard.styles';

const ICON_SIZE = 20;

interface Props {
  readonly ride: RideListItemDto;
  // undefined tant que le détail (tracé complet) n'est pas encore chargé —
  // la carte et l'export GPX en ont besoin, le reste de la carte non.
  readonly points: readonly TrackPoint[] | undefined;
  readonly onRelaunch: () => void;
  readonly onExportGpx: () => void;
  readonly isExportingGpx: boolean;
  readonly onToggleFavorite: () => void;
}

export function LastRideHeroCard({
  ride,
  points,
  onRelaunch,
  onExportGpx,
  isExportingGpx,
  onToggleFavorite,
}: Props): React.JSX.Element {
  const avgSpeedMps = ride.summary.durationSeconds > 0 ? ride.summary.distanceMeters / ride.summary.durationSeconds : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.badge}>
            <Text variant="monoBold" color={colors.onAccentLight} style={styles.badgeLabel}>
              DERNIER ROULAGE
            </Text>
          </View>
          <Text variant="mono" color={colors.textDense} style={styles.dateLabel}>
            {formatRideDate(ride.startedAt).toUpperCase()}
          </Text>
        </View>
        <Text variant="title" numberOfLines={1} style={styles.name}>
          {ride.name}
        </Text>
        <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
          {`${formatDistanceKm(ride.summary.distanceMeters)} · ${formatDuration(ride.summary.durationSeconds)}`}
        </Text>
      </View>

      <View style={styles.mapWrapper}>
        {points !== undefined ? <RideTrackMap path={points.map((point) => point.position)} /> : null}
        {/* Nombre de virages : aucune détection de virage dans l'app — FICTIF, voir CLAUDE.md. */}
        <View style={styles.mapOverlayBadge}>
          <MaterialCommunityIcons name="flask-outline" size={11} color={colors.danger} />
          <Text variant="label" color={colors.danger} style={styles.mapOverlayLabel}>
            84 VIRAGES SERRÉS (FICTIF)
          </Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <Text variant="mono" color={colors.textDense} style={styles.statLabel}>
            VIT. MOY.
          </Text>
          <Text variant="monoBold" color={colors.textPrimary} style={styles.statValue}>
            {`${formatSpeedKmhValue(avgSpeedMps)} km/h`}
          </Text>
        </View>
        <View style={styles.statTile}>
          <Text variant="mono" color={colors.textDense} style={styles.statLabel}>
            DÉNIVELÉ
          </Text>
          <Text variant="monoBold" color={colors.accent} style={styles.statValue}>
            {`${formatElevationMeters(ride.summary.elevationGainMeters)} m`}
          </Text>
        </View>
        <View style={styles.statTile}>
          <Text variant="mono" color={colors.danger} style={styles.statLabel}>
            ANGLE MAX
          </Text>
          <Text variant="label" color={colors.danger} style={styles.statValue}>
            FICTIF
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Refaire ce trajet"
          onPress={onRelaunch}
          style={({ pressed }) => [styles.relaunchButton, pressed ? styles.pressed : null]}
        >
          <MaterialCommunityIcons name="replay" size={ICON_SIZE} color={colors.onAccentLight} />
          <Text variant="monoBold" color={colors.onAccentLight} style={styles.relaunchLabel}>
            REFAIRE LE TRAJET
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Exporter la trace GPX"
          accessibilityState={{ disabled: isExportingGpx || points === undefined }}
          disabled={isExportingGpx || points === undefined}
          onPress={onExportGpx}
          style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
        >
          <MaterialCommunityIcons name="share-variant-outline" size={ICON_SIZE} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={ride.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          accessibilityState={{ selected: ride.isFavorite }}
          onPress={onToggleFavorite}
          style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
        >
          <MaterialCommunityIcons
            name={ride.isFavorite ? 'star' : 'star-outline'}
            size={ICON_SIZE}
            color={ride.isFavorite ? colors.accent : colors.textPrimary}
          />
        </Pressable>
      </View>
    </View>
  );
}
