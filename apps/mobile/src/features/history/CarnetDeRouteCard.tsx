import { MaterialCommunityIcons } from '@expo/vector-icons';
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

// Distance et heures roulées : vraies sommes sur l'historique réel. "Cols
// franchis" et le niveau de sinuosité n'existent dans aucune donnée de
// l'app (aucune détection de col ni de virage) — <MockTag /> plutôt que les
// masquer, comme demandé, mais jamais sans ce marqueur.
export function CarnetDeRouteCard({ rides }: Props): React.JSX.Element {
  const totalDistanceKm = Math.round(
    rides.reduce((sum, ride) => sum + ride.summary.distanceMeters, 0) / METERS_PER_KM,
  );
  const totalHours = Math.round(rides.reduce((sum, ride) => sum + ride.summary.durationSeconds, 0) / SECONDS_PER_HOUR);
  const currentYear = new Date().getFullYear();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="notebook-outline" size={14} color={colors.accent} />
          <Text variant="mono" color={colors.textDense} style={styles.headerLabel}>
            {`CARNET DE ROUTE · ${String(currentYear)}`}
          </Text>
        </View>
        <View style={styles.mockBadge}>
          <MaterialCommunityIcons name="flask-outline" size={12} color={colors.danger} />
          <Text variant="label" color={colors.danger} style={styles.mockBadgeLabel}>
            SINUEUX NIV. 4 (FICTIF)
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <View style={styles.tile}>
          <Text variant="mono" color={colors.textDense} style={styles.tileLabel}>
            DISTANCE
          </Text>
          <Text variant="monoBold" color={colors.textPrimary} style={styles.tileValue}>
            {totalDistanceKm}
          </Text>
          <Text variant="mono" color={colors.accent} style={styles.tileUnit}>
            KILOMÈTRES
          </Text>
        </View>
        <View style={styles.tile}>
          <Text variant="mono" color={colors.textDense} style={styles.tileLabel}>
            SELLE
          </Text>
          <Text variant="monoBold" color={colors.textPrimary} style={styles.tileValue}>
            {`${String(totalHours)}h`}
          </Text>
          <Text variant="mono" color={colors.textSecondary} style={styles.tileUnit}>
            ROULÉES
          </Text>
        </View>
        <View style={styles.tile}>
          <View style={styles.header}>
            <Text variant="mono" color={colors.textDense} style={styles.tileLabel}>
              COLS
            </Text>
          </View>
          <Text variant="monoBold" color={colors.accent} style={styles.tileValue}>
            34
          </Text>
          <Text variant="label" color={colors.danger} style={styles.tileUnit}>
            FICTIF
          </Text>
        </View>
      </View>
    </View>
  );
}
