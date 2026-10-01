import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AddressSuggestionDto, RouteGeometryDto } from '@roadtalk/contracts';
import type React from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { Pressable, View } from 'react-native';

import { colors, Text } from '../../ui';
import { formatArrivalTime, formatDistanceKm, formatDuration } from '../routing/format';
import { styles } from './TripSummaryCard.styles';

const ICON_SIZE = 18;
const START_ICON_SIZE = 22;

interface Props {
  // Dans l'ordre de visite — jamais vide quand ce composant est rendu,
  // l'écran parent ne le monte pas sinon.
  readonly stops: readonly AddressSuggestionDto[];
  readonly route: RouteGeometryDto | undefined;
  readonly isComputing: boolean;
  readonly error: string | undefined;
  readonly onRemoveStop: (index: number) => void;
  // Focus la barre de recherche (voir MapScreen, searchInputRef) — pas de
  // sélecteur dédié, ajouter un arrêt passe toujours par la recherche.
  readonly onAddStop: () => void;
  readonly onStart: () => void;
  readonly onLayout: (event: LayoutChangeEvent) => void;
}

// Écran de préparation, pas de guidage (DA section 8) : la feuille de route
// complète avant de rouler — pas les 3 infos du mode guidage, un contexte
// différent avec des besoins différents.
export function TripSummaryCard({
  stops,
  route,
  isComputing,
  error,
  onRemoveStop,
  onAddStop,
  onStart,
  onLayout,
}: Props): React.JSX.Element {
  // +1 : la position de départ compte comme premier jalon, bien qu'elle ne
  // fasse jamais partie de `stops` (voir MapScreen).
  const waypointCount = stops.length + 1;

  return (
    <View style={styles.card} onLayout={onLayout}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <MaterialCommunityIcons name="routes" size={18} color={colors.textPrimary} />
          <Text variant="title" style={styles.headerTitleText}>
            Feuille de route
          </Text>
        </View>
        <View style={styles.jalonsBadge}>
          <Text variant="mono" color={colors.textDense}>
            {waypointCount} {waypointCount > 1 ? 'jalons' : 'jalon'}
          </Text>
        </View>
      </View>

      <View style={styles.stepsList}>
        <View style={styles.stepRow}>
          <View style={[styles.stepBadge, styles.originBadge]}>
            <Text variant="monoBold" color={colors.accentLight}>
              D
            </Text>
          </View>
          <View style={styles.stepTexts}>
            <Text variant="mono" color={colors.textDense}>
              Départ immédiat
            </Text>
            {/* Pas de géocodage inverse de la position de l'utilisateur
                lui-même (coûteux, jamais utilisé ailleurs) : un libellé
                générique plutôt qu'une fausse adresse précise. */}
            <Text variant="body" numberOfLines={1}>
              Position actuelle
            </Text>
          </View>
        </View>

        {stops.map((stop, index) => {
          const isLast = index === stops.length - 1;

          return (
            <View
              key={`${stop.label}-${String(stop.latitude)}-${String(stop.longitude)}`}
              style={styles.stepRow}
            >
              <View style={[styles.stepBadge, isLast ? styles.terminusBadge : null]}>
                <Text variant="monoBold" color={isLast ? colors.onAccentLight : colors.textPrimary}>
                  {isLast ? 'A' : index + 1}
                </Text>
              </View>
              <View style={styles.stepTexts}>
                <Text variant="mono" color={colors.textDense}>
                  {isLast ? 'Terminus' : `Étape ${String(index + 1)}`}
                </Text>
                <Text variant="body" numberOfLines={1}>
                  {stop.label}
                </Text>
              </View>
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
          );
        })}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ajouter un arrêt"
          onPress={onAddStop}
          style={({ pressed }) => [styles.addStopButton, pressed ? styles.addStopButtonPressed : null]}
        >
          <MaterialCommunityIcons name="map-marker-plus-outline" size={ICON_SIZE} color={colors.textPrimary} />
          <Text variant="monoBold" color={colors.textPrimary}>
            Ajouter un arrêt
          </Text>
        </Pressable>
      </View>

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
          <Stat value={formatDuration(route.durationSeconds)} caption="Durée estimée" />
          <Stat value={formatArrivalTime(route.durationSeconds)} caption="Arrivée" />
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Démarrer le guidage"
        accessibilityState={{ disabled: route === undefined }}
        disabled={route === undefined}
        onPress={onStart}
        style={({ pressed }) => [
          styles.startButton,
          route === undefined ? styles.startButtonDisabled : null,
          pressed ? styles.startButtonPressed : null,
        ]}
      >
        <Text variant="title" color={colors.onAccentLight} style={styles.startButtonLabel}>
          Démarrer le guidage
        </Text>
        <MaterialCommunityIcons name="navigation-variant" size={START_ICON_SIZE} color={colors.onAccentLight} />
      </Pressable>
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
      <Text variant="monoBold" color={colors.textPrimary} style={styles.statValue}>
        {value}
      </Text>
      <Text variant="mono" color={colors.textDense}>
        {caption}
      </Text>
    </View>
  );
}
