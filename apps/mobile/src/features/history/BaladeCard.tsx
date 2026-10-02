import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { colors, Text } from '../../ui';
import { formatElevationMeters, formatSpeedKmhValue } from '../ride-summary/format';
import { exportRouteAsGpx, exportTrackAsGpx } from '../ride-summary/gpx-export';
import { RideTrackMap } from '../ride-summary/RideTrackMap';
import { formatDistanceKm, formatDuration } from '../routing/format';
import { styles } from './BaladeCard.styles';
import { type BaladeItem, itemDate, itemIsFavorite, itemName } from './baladeItem';
import { formatRideDate } from './format';
import { type BaladeGeometry, useBaladeGeometry } from './useBaladeGeometry';

const ICON_SIZE = 20;

interface Props {
  readonly item: BaladeItem;
  readonly onOpenDetail: () => void;
  // Reçoit le tracé déjà chargé par la carte : relancer une balade vise son
  // point d'arrivée, connu seulement une fois le tracé arrivé.
  readonly onLaunch: (geometry: BaladeGeometry | undefined) => void;
  readonly onToggleFavorite: () => void;
  readonly onExportFailed: () => void;
}

// Grande carte de mise en avant, en tête de la liste : la dernière balade
// roulée, avec son aperçu de carte, ses statistiques et ses actions. Le reste
// de la liste utilise la ligne compacte (BaladeRow). La carte charge
// elle-même son tracé (useBaladeGeometry) pour l'aperçu et l'export.
export function BaladeCard({
  item,
  onOpenDetail,
  onLaunch,
  onToggleFavorite,
  onExportFailed,
}: Props): React.JSX.Element {
  const geometry = useBaladeGeometry(item);
  const [isExporting, setIsExporting] = useState(false);
  const isRide = item.kind === 'ride';
  const name = itemName(item, formatRideDate);
  const isFavorite = itemIsFavorite(item);
  const kindLabel = isRide ? 'Dernière balade' : 'Itinéraire';

  const handleExport = (): void => {
    if (geometry === undefined) {
      return;
    }
    setIsExporting(true);
    const exporting =
      geometry.points !== undefined
        ? exportTrackAsGpx(name, geometry.points)
        : exportRouteAsGpx(name, geometry.path);
    exporting.catch(onExportFailed).finally(() => {
      setIsExporting(false);
    });
  };

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Voir le détail de ${name}`}
        onPress={onOpenDetail}
        style={({ pressed }) => (pressed ? styles.pressed : null)}
      >
        <View style={styles.header}>
          <Text variant="caption" color={colors.textSecondary}>
            {`${kindLabel} · ${formatRideDate(itemDate(item))}`}
          </Text>
          <View style={styles.nameRow}>
            <Text variant="title" numberOfLines={1} style={styles.name}>
              {name}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </View>
        </View>

        <View style={styles.mapWrapper}>
          {geometry !== undefined ? <RideTrackMap path={geometry.path} /> : null}
        </View>

        <View style={styles.statsRow}>
          {isRide ? (
            <>
              <Stat label="Distance" value={formatDistanceKm(item.ride.summary.distanceMeters)} />
              <Stat label="Durée" value={formatDuration(item.ride.summary.durationSeconds)} />
              <Stat label="Vit. moy." value={`${formatSpeedKmhValue(item.ride.summary.averageSpeedMps)} km/h`} />
              <Stat label="Dénivelé" value={`${formatElevationMeters(item.ride.summary.elevationGainMeters)} m`} />
            </>
          ) : (
            <>
              {item.route.distanceMeters !== undefined ? (
                <Stat label="Distance" value={formatDistanceKm(item.route.distanceMeters)} />
              ) : null}
              {item.route.durationSeconds !== undefined ? (
                <Stat label="Durée estimée" value={formatDuration(item.route.durationSeconds)} />
              ) : null}
              <Stat label="Autoroutes" value={item.route.routingOptions.avoidHighways ? 'Évitées' : 'Autorisées'} />
            </>
          )}
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRide ? 'Refaire ce trajet' : 'Lancer cet itinéraire'}
          // Une balade se relance vers son point d'arrivée, connu avec le tracé.
          accessibilityState={{ disabled: isRide && geometry === undefined }}
          disabled={isRide && geometry === undefined}
          onPress={() => {
            onLaunch(geometry);
          }}
          style={({ pressed }) => [styles.launchButton, pressed ? styles.pressed : null]}
        >
          <MaterialCommunityIcons
            name={isRide ? 'replay' : 'navigation-variant'}
            size={ICON_SIZE}
            color={colors.onAccentLight}
          />
          <Text variant="captionStrong" color={colors.onAccentLight} style={styles.launchLabel}>
            {isRide ? 'Refaire le trajet' : 'Lancer'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Partager au format GPX"
          accessibilityState={{ disabled: isExporting || geometry === undefined }}
          disabled={isExporting || geometry === undefined}
          onPress={handleExport}
          style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
        >
          <MaterialCommunityIcons name="share-variant-outline" size={ICON_SIZE} color={colors.textPrimary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          accessibilityState={{ selected: isFavorite }}
          onPress={onToggleFavorite}
          style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
        >
          <MaterialCommunityIcons
            name={isFavorite ? 'star' : 'star-outline'}
            size={ICON_SIZE}
            color={isFavorite ? colors.accent : colors.textPrimary}
          />
        </Pressable>
      </View>
    </View>
  );
}

interface StatProps {
  readonly label: string;
  readonly value: string;
}

function Stat({ label, value }: StatProps): React.JSX.Element {
  return (
    <View style={styles.statTile}>
      <Text variant="captionStrong" numberOfLines={1} style={styles.statValue}>
        {value}
      </Text>
      <Text variant="caption" color={colors.textSecondary} style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}
