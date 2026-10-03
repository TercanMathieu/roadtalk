import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ManeuverDto } from '@roadtalk/contracts';
import type React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, Text } from '../../ui';
import { formatManeuverDistanceParts } from '../routing/format';
import type { GuidanceStatus } from './guidance-status';
import { getManeuverLabel } from './maneuver-labels';
import { styles } from './ManeuverBanner.styles';
import { ManeuverIcon } from './ManeuverIcon';

const ICON_SIZE = 52;
const STATUS_ICON_SIZE = 34;
const THEN_ICON_SIZE = 24;
// En dessous, un décompte en mètres n'aide plus : le GPS n'est pas assez
// précis et il n'y a plus le temps de le lire — c'est le moment d'agir.
const NOW_THRESHOLD_METERS = 30;

interface Props {
  readonly status: GuidanceStatus;
  // undefined quand il ne reste plus de manœuvre (derniers mètres avant
  // l'arrivée) : le bandeau n'affiche alors rien de plus que l'état.
  readonly maneuver: ManeuverDto | undefined;
  readonly distanceMeters: number | undefined;
  // Manœuvre enchaînée juste après (voir RouteProgress.thenManeuver).
  readonly thenManeuver: ManeuverDto | undefined;
}

// Ce qu'il faut faire, dans l'ordre de lecture : le pictogramme, dans combien
// de mètres, puis l'action en toutes lettres. Pas de nom de rue (décision
// explicite) : en roulant, un sens de direction se lit d'un coup d'œil, une
// adresse demande de lire et de comparer (C2).
//
// Hors itinéraire, la manœuvre affichée serait fausse : le bandeau la
// remplace par l'état réel (recalcul en cours) plutôt que de laisser une
// consigne qui ne correspond plus à la route suivie.
export function ManeuverBanner({ status, maneuver, distanceMeters, thenManeuver }: Props): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const containerStyle = [styles.banner, { paddingTop: insets.top + spacing.sm }];

  if (status !== 'on-route') {
    return (
      <View style={containerStyle}>
        <View style={styles.iconSquare}>
          {status === 'rerouting' ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <MaterialCommunityIcons name="map-marker-alert-outline" size={STATUS_ICON_SIZE} color={colors.danger} />
          )}
        </View>
        <View style={styles.texts}>
          <Text variant="title" style={styles.statusTitle}>
            {status === 'rerouting' ? 'Recalcul…' : 'Hors itinéraire'}
          </Text>
          <Text variant="body" color={colors.textSecondary} style={styles.statusDetail}>
            {status === 'rerouting' ? 'Nouvel itinéraire en cours de calcul' : 'Rejoins le tracé orange'}
          </Text>
        </View>
      </View>
    );
  }

  if (maneuver === undefined || distanceMeters === undefined) {
    return null;
  }

  const { value, unit } = formatManeuverDistanceParts(distanceMeters);
  const isNow = distanceMeters <= NOW_THRESHOLD_METERS;

  return (
    <View style={containerStyle}>
      <View style={styles.iconSquare}>
        <ManeuverIcon maneuver={maneuver} size={ICON_SIZE} color={colors.accent} />
      </View>
      <View style={styles.texts}>
        {isNow ? (
          <Text variant="display" style={styles.distanceValue}>
            Maintenant
          </Text>
        ) : (
          <View style={styles.distanceRow}>
            <Text variant="display" tabularNums style={styles.distanceValue}>
              {value}
            </Text>
            <Text variant="title" color={colors.textSecondary} style={styles.distanceUnit}>
              {unit}
            </Text>
          </View>
        )}
        <Text variant="body" numberOfLines={1} style={styles.directionLabel}>
          {getManeuverLabel(maneuver)}
        </Text>
      </View>
      {thenManeuver !== undefined ? (
        <View
          accessible
          accessibilityLabel={`Puis : ${getManeuverLabel(thenManeuver)}`}
          style={styles.thenChip}
        >
          <Text variant="caption" color={colors.textSecondary}>
            puis
          </Text>
          <ManeuverIcon maneuver={thenManeuver} size={THEN_ICON_SIZE} color={colors.textPrimary} />
        </View>
      ) : null}
    </View>
  );
}
