import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { GeoPoint } from '@roadtalk/domain-shared';
import type React from 'react';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, Text } from '../../ui';
import { formatElevationMeters, formatSpeedKmhValue } from '../ride-summary/format';
import { exportTrackAsGpx } from '../ride-summary/gpx-export';
import { RideTrackMap } from '../ride-summary/RideTrackMap';
import type { TrackPoint } from '../ride-summary/track-point';
import { formatDistanceKm, formatDuration } from '../routing/format';
import { styles } from './BaladeDetailModal.styles';
import { type BaladeItem, confirmDeleteBaladeItem } from './baladeItem';
import { formatRideDate } from './format';

const ICON_SIZE = 20;
const GPX_EXPORT_FAILED_MESSAGE = "L'export GPX a échoué.";

interface Props {
  readonly item: BaladeItem;
  // undefined tant que le tracé d'une balade n'est pas encore chargé par
  // l'écran appelant. Uniquement pour une balade (nécessaire à l'export GPX,
  // que mapPath seul ne permet pas).
  readonly points: readonly TrackPoint[] | undefined;
  // Chemin à afficher sur la carte — tracé GPS réel pour une balade,
  // chemin recalculé par le moteur de routage (routes réelles, jamais une
  // ligne droite) pour un itinéraire pas encore roulé. undefined tant qu'il
  // n'est pas encore chargé.
  readonly mapPath: readonly GeoPoint[] | undefined;
  readonly onClose: () => void;
  readonly onDelete: () => void;
  readonly onLaunch: () => void;
  readonly onToggleFavorite: (() => void) | undefined;
}

// Même contenu que LastRideHeroCard (map, stats, actions) mais pour
// n'importe quelle ligne de l'historique, pas seulement la plus récente — et
// avec la suppression ici plutôt que dans la ligne de liste (demande
// explicite : ne garder que "Lancer" sur la carte compacte).
export function BaladeDetailModal({ item, points, mapPath, onClose, onDelete, onLaunch, onToggleFavorite }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const isRide = item.kind === 'ride';
  const [isExportingGpx, setIsExportingGpx] = useState(false);

  const name = isRide
    ? item.ride.name
    : (item.route.name ?? `Itinéraire du ${formatRideDate(item.route.createdAt)}`);
  const date = isRide ? item.ride.startedAt : item.route.createdAt;
  const distanceMeters = isRide ? item.ride.summary.distanceMeters : item.route.distanceMeters;
  const durationSeconds = isRide ? item.ride.summary.durationSeconds : item.route.durationSeconds;
  const avoidHighways = !isRide && item.route.routingOptions.avoidHighways;

  const handleExportGpx = (): void => {
    if (points === undefined) {
      return;
    }
    setIsExportingGpx(true);
    exportTrackAsGpx(name, points)
      .catch(() => {
        Alert.alert(GPX_EXPORT_FAILED_MESSAGE);
      })
      .finally(() => {
        setIsExportingGpx(false);
      });
  };

  const handleDelete = (): void => {
    confirmDeleteBaladeItem(item, name, () => {
      onClose();
      onDelete();
    });
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={[styles.badge, isRide ? styles.badgeRide : styles.badgeRoute]}>
                <Text
                  variant="monoBold"
                  color={isRide ? colors.onAccentLight : colors.textPrimary}
                  style={styles.badgeLabel}
                >
                  {isRide ? 'BALADE' : 'ITINÉRAIRE'}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                onPress={onClose}
                hitSlop={8}
                style={({ pressed }) => (pressed ? styles.pressed : null)}
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text variant="title" style={styles.name}>
              {name}
            </Text>
            <Text variant="mono" color={colors.textDense} style={styles.dateLabel}>
              {formatRideDate(date).toUpperCase()}
            </Text>
          </View>

          {mapPath !== undefined ? (
            <View style={styles.mapWrapper}>
              <RideTrackMap path={mapPath} />
              {isRide ? (
                <View style={styles.mapOverlayBadge}>
                  <MaterialCommunityIcons name="flask-outline" size={11} color={colors.danger} />
                  <Text variant="label" color={colors.danger} style={styles.mapOverlayLabel}>
                    84 VIRAGES SERRÉS (FICTIF)
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.statsRow}>
            {distanceMeters !== undefined ? (
              <View style={styles.statTile}>
                <Text variant="mono" color={colors.textDense} style={styles.statLabel}>
                  DISTANCE
                </Text>
                <Text variant="monoBold" color={colors.textPrimary} style={styles.statValue}>
                  {formatDistanceKm(distanceMeters)}
                </Text>
              </View>
            ) : null}
            {durationSeconds !== undefined ? (
              <View style={styles.statTile}>
                <Text variant="mono" color={colors.textDense} style={styles.statLabel}>
                  DURÉE
                </Text>
                <Text variant="monoBold" color={colors.textPrimary} style={styles.statValue}>
                  {formatDuration(durationSeconds)}
                </Text>
              </View>
            ) : null}
            {isRide ? (
              <View style={styles.statTile}>
                <Text variant="mono" color={colors.textDense} style={styles.statLabel}>
                  VIT. MOY.
                </Text>
                <Text variant="monoBold" color={colors.textPrimary} style={styles.statValue}>
                  {`${formatSpeedKmhValue(item.ride.summary.averageSpeedMps)} km/h`}
                </Text>
              </View>
            ) : null}
            {isRide ? (
              <View style={styles.statTile}>
                <Text variant="mono" color={colors.textDense} style={styles.statLabel}>
                  DÉNIVELÉ
                </Text>
                <Text variant="monoBold" color={colors.accent} style={styles.statValue}>
                  {`${formatElevationMeters(item.ride.summary.elevationGainMeters)} m`}
                </Text>
              </View>
            ) : null}
            {isRide ? (
              <View style={styles.statTile}>
                <Text variant="mono" color={colors.danger} style={styles.statLabel}>
                  ANGLE MAX
                </Text>
                <Text variant="label" color={colors.danger} style={styles.statValue}>
                  FICTIF
                </Text>
              </View>
            ) : null}
            {avoidHighways ? (
              <View style={styles.statTile}>
                <Text variant="mono" color={colors.textDense} style={styles.statLabel}>
                  OPTION
                </Text>
                <Text variant="monoBold" color={colors.textPrimary} style={styles.statValue}>
                  SANS AUTOROUTE
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Lancer"
              onPress={onLaunch}
              style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}
            >
              <MaterialCommunityIcons
                name={isRide ? 'replay' : 'navigation-variant'}
                size={ICON_SIZE}
                color={colors.onAccentLight}
              />
              <Text variant="monoBold" color={colors.onAccentLight} style={styles.primaryButtonLabel}>
                {isRide ? 'Refaire le Trajet' : 'Lancer'}
              </Text>
            </Pressable>
            <View style={styles.secondaryRow}>
              {isRide ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Exporter la trace GPX"
                  accessibilityState={{ disabled: isExportingGpx || points === undefined }}
                  disabled={isExportingGpx || points === undefined}
                  onPress={handleExportGpx}
                  style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
                >
                  <MaterialCommunityIcons name="share-variant-outline" size={ICON_SIZE} color={colors.textPrimary} />
                </Pressable>
              ) : null}
              {onToggleFavorite !== undefined ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={isRide && item.ride.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  onPress={onToggleFavorite}
                  style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
                >
                  <MaterialCommunityIcons
                    name={isRide && item.ride.isFavorite ? 'star' : 'star-outline'}
                    size={ICON_SIZE}
                    color={isRide && item.ride.isFavorite ? colors.accent : colors.textPrimary}
                  />
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Supprimer ${name}`}
                onPress={handleDelete}
                style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={ICON_SIZE} color={colors.danger} />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
