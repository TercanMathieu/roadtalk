import type { RideListItemDto } from '@roadtalk/contracts';
import type React from 'react';
import { View } from 'react-native';

import { colors, Text } from '../../ui';
import { styles } from './CarnetDeRouteCard.styles';

interface Props {
  readonly rides: readonly RideListItemDto[];
}

const SECONDS_PER_HOUR = 3600;
const METERS_PER_KM = 1000;

// Uniquement de vraies sommes sur l'historique réel (distance, heures
// roulées). Les anciens indicateurs fictifs ("cols franchis", niveau de
// sinuosité) ont été retirés : aucune donnée de l'app ne les alimente.
export function CarnetDeRouteCard({ rides }: Props): React.JSX.Element {
  const totalDistanceKm = Math.round(
    rides.reduce((sum, ride) => sum + ride.summary.distanceMeters, 0) / METERS_PER_KM,
  );
  const totalHours = Math.round(rides.reduce((sum, ride) => sum + ride.summary.durationSeconds, 0) / SECONDS_PER_HOUR);

  return (
    <View style={styles.card}>
      <Stat value={String(totalDistanceKm)} unit="km" caption="parcourus" />
      <View style={styles.divider} />
      <Stat value={String(totalHours)} unit="h" caption="en selle" />
      <View style={styles.divider} />
      <Stat value={String(rides.length)} unit="" caption={rides.length > 1 ? 'balades' : 'balade'} />
    </View>
  );
}

interface StatProps {
  readonly value: string;
  readonly unit: string;
  readonly caption: string;
}

function Stat({ value, unit, caption }: StatProps): React.JSX.Element {
  return (
    <View style={styles.stat}>
      <Text variant="captionStrong" style={styles.value}>
        {value}
        {unit.length > 0 ? (
          <Text variant="captionStrong" color={colors.textSecondary} style={styles.unit}>
            {` ${unit}`}
          </Text>
        ) : null}
      </Text>
      <Text variant="caption" color={colors.textSecondary}>
        {caption}
      </Text>
    </View>
  );
}
