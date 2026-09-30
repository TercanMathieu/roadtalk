import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AddressSuggestionDto, RouteGeometryDto } from '@roadtalk/contracts';
import type React from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Pressable, View } from 'react-native';

import { colors, Text } from '../../ui';
import { formatArrivalTime, formatDistanceKm, formatDuration } from '../routing/format';
import { styles } from './TripSummaryCard.styles';

const ICON_SIZE = 22;

interface Props {
  // Dans l'ordre de visite — jamais vide quand ce composant est rendu,
  // l'écran parent ne le monte pas sinon.
  readonly stops: readonly AddressSuggestionDto[];
  readonly route: RouteGeometryDto | undefined;
  readonly isComputing: boolean;
  readonly error: string | undefined;
  // Retire un arrêt précis plutôt qu'un "annuler tout" séparé : retirer le
  // dernier arrêt restant vide la liste, et l'écran parent referme la carte
  // de lui-même — un seul geste à apprendre, cohérent quel que soit le
  // nombre d'arrêts.
  readonly onRemoveStop: (index: number) => void;
  // Remonte la hauteur réelle de la carte : elle varie avec le nombre
  // d'arrêts et son contenu (chargement, erreur, ou les trois statistiques),
  // et l'écran parent s'en sert pour ne pas laisser le bouton de recentrage
  // la chevaucher.
  readonly onLayout: (event: LayoutChangeEvent) => void;
}

// Écran de préparation, pas de guidage (DA section 8) : trois chiffres au
// choix de la destination, avant de rouler — pas les 3 infos du mode
// guidage, un contexte différent avec des besoins différents.
export function TripSummaryCard({
  stops,
  route,
  isComputing,
  error,
  onRemoveStop,
  onLayout,
}: Props): React.JSX.Element {
  return (
    <View style={styles.card} onLayout={onLayout}>
      {stops.map((stop, index) => (
        <View
          key={`${stop.label}-${String(stop.latitude)}-${String(stop.longitude)}`}
          style={[styles.stopRow, index === 0 ? styles.firstStopRow : null]}
        >
          <Text variant="title" numberOfLines={1} style={styles.stopLabel}>
            {stop.label}
          </Text>
          <Pressable
            onPress={() => {
              onRemoveStop(index);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Retirer l'arrêt ${stop.label}`}
            style={styles.closeButton}
          >
            <MaterialCommunityIcons name="close" size={ICON_SIZE} color={colors.textSecondary} />
          </Pressable>
        </View>
      ))}

      {error !== undefined ? (
        <Text variant="body" color={colors.danger} style={styles.message}>
          {error}
        </Text>
      ) : null}

      {error === undefined && (isComputing || route === undefined) ? (
        <Text variant="body" color={colors.textSecondary} style={styles.message}>
          Calcul de l'itinéraire…
        </Text>
      ) : null}

      {error === undefined && route !== undefined ? (
        <View style={styles.stats}>
          <Stat value={formatDistanceKm(route.distanceMeters)} caption="Distance" />
          <Stat value={formatDuration(route.durationSeconds)} caption="Durée" />
          <Stat value={formatArrivalTime(route.durationSeconds)} caption="Arrivée" />
        </View>
      ) : null}

      <Text variant="label" color={colors.textSecondary} style={styles.addStopHint}>
        Touche la barre de recherche pour ajouter un arrêt
      </Text>
    </View>
  );
}

interface StatProps {
  readonly value: string;
  readonly caption: string;
}

function Stat({ value, caption }: StatProps): React.JSX.Element {
  return (
    <View style={styles.stat}>
      <Text variant="title" tabularNums>
        {value}
      </Text>
      <Text variant="label" color={colors.textSecondary} style={styles.statCaption}>
        {caption}
      </Text>
    </View>
  );
}
