import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { Pressable, View } from 'react-native';

import { colors, Text } from '../../ui';
import { formatDistanceKm, formatDuration } from '../routing/format';
import { type BaladeItem, itemDate, itemName } from './baladeItem';
import { styles } from './BaladeRow.styles';
import { formatRideDate } from './format';

const ICON_SIZE = 18;

interface Props {
  readonly item: BaladeItem;
  readonly onPress: () => void;
  readonly onLaunch: () => void;
}

// Ligne compacte de la liste : icône de type, nom, puis une seule ligne de
// détails (type · date · distance · durée). Le type reste honnête (Balade /
// Itinéraire), jamais une classification inventée. Un appui ouvre le détail
// (BaladeDetailModal), le même que pour la dernière balade : partage, favori,
// renommage et suppression y vivent. "Lancer" reste accessible directement ici.
export function BaladeRow({ item, onPress, onLaunch }: Props): React.JSX.Element {
  const isRide = item.kind === 'ride';
  const name = itemName(item, formatRideDate);
  const distanceMeters = isRide ? item.ride.summary.distanceMeters : item.route.distanceMeters;
  const durationSeconds = isRide ? item.ride.summary.durationSeconds : item.route.durationSeconds;
  const avoidHighways = !isRide && item.route.routingOptions.avoidHighways;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voir le détail de ${name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <View style={[styles.icon, isRide ? styles.iconRide : null]}>
        <MaterialCommunityIcons
          name={isRide ? 'motorbike' : 'map-marker-path'}
          size={ICON_SIZE}
          color={isRide ? colors.accent : colors.textSecondary}
        />
      </View>
      <View style={styles.texts}>
        <Text variant="title" numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        <Text variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {[
            isRide ? 'Balade' : 'Itinéraire',
            formatRideDate(itemDate(item)),
            distanceMeters !== undefined ? formatDistanceKm(distanceMeters) : undefined,
            durationSeconds !== undefined ? formatDuration(durationSeconds) : undefined,
            avoidHighways ? 'sans autoroute' : undefined,
          ]
            .filter((part) => part !== undefined)
            .join(' · ')}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Relancer ${name}`}
        onPress={onLaunch}
        hitSlop={4}
        style={({ pressed }) => [styles.launchButton, pressed ? styles.pressed : null]}
      >
        <MaterialCommunityIcons name="navigation-variant" size={ICON_SIZE} color={colors.accent} />
      </Pressable>
    </Pressable>
  );
}
