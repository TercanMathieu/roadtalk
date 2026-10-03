import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, Text } from '../../ui';
import { formatElevationMeters, formatSpeedKmhValue } from '../ride-summary/format';
import { exportRouteAsGpx, exportTrackAsGpx } from '../ride-summary/gpx-export';
import { RideTrackMap } from '../ride-summary/RideTrackMap';
import { formatDistanceKm, formatDuration } from '../routing/format';
import { styles } from './BaladeDetailModal.styles';
import { type BaladeItem, confirmDeleteBaladeItem, itemIsFavorite, itemName } from './baladeItem';
import { formatRideDate } from './format';
import { ItineraryRecap } from './ItineraryRecap';
import { type BaladeGeometry, useBaladeGeometry } from './useBaladeGeometry';
import { useItineraryRecap } from './useItineraryRecap';

const ICON_SIZE = 20;
// Même limite que le contrat de l'API (renameRideRequestSchema).
const NAME_MAX_LENGTH = 120;
const GPX_EXPORT_FAILED_MESSAGE = "L'export GPX a échoué.";

interface Props {
  // Toujours la version à jour de la liste (voir HistoryScreen) : un favori
  // ou un nom modifié ailleurs se reflète ici.
  readonly item: BaladeItem;
  readonly onClose: () => void;
  readonly onDelete: () => void;
  // Reçoit le tracé chargé par ce détail — voir BaladeCard.onLaunch.
  readonly onLaunch: (geometry: BaladeGeometry | undefined) => void;
  readonly onToggleFavorite: () => void;
  // Nom déjà nettoyé (espaces de bord retirés) et jamais vide.
  readonly onRename: (name: string) => void;
}

// Le détail d'une balade ou d'un itinéraire : la carte de la liste
// (BaladeCard) en plus complet — nom modifiable, récapitulatif du parcours,
// et la suppression, volontairement absente de la liste.
export function BaladeDetailModal({
  item,
  onClose,
  onDelete,
  onLaunch,
  onToggleFavorite,
  onRename,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const isRide = item.kind === 'ride';
  const [isExportingGpx, setIsExportingGpx] = useState(false);
  const geometry = useBaladeGeometry(item);
  const points = geometry?.points;
  const mapPath = geometry?.path;
  const recapSteps = useItineraryRecap(item, points);
  const isFavorite = itemIsFavorite(item);

  const initialName = itemName(item, formatRideDate);
  // `name` : dernier nom validé. `nameDraft` : ce qui est en cours de frappe.
  const [name, setName] = useState(initialName);
  const [nameDraft, setNameDraft] = useState(initialName);

  const commitName = (): void => {
    const trimmed = nameDraft.trim();
    // Un nom vide n'est pas un nom : on revient au précédent plutôt que
    // d'enregistrer une balade sans titre.
    if (trimmed.length === 0 || trimmed === name) {
      setNameDraft(name);
      return;
    }
    setName(trimmed);
    setNameDraft(trimmed);
    onRename(trimmed);
  };
  const date = isRide ? item.ride.startedAt : item.route.createdAt;
  const distanceMeters = isRide ? item.ride.summary.distanceMeters : item.route.distanceMeters;
  const durationSeconds = isRide ? item.ride.summary.durationSeconds : item.route.durationSeconds;
  const avoidHighways = !isRide && item.route.routingOptions.avoidHighways;

  const handleExportGpx = (): void => {
    if (geometry === undefined) {
      return;
    }
    setIsExportingGpx(true);
    const exporting =
      geometry.points !== undefined ? exportTrackAsGpx(name, geometry.points) : exportRouteAsGpx(name, geometry.path);
    exporting
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
                  variant="captionStrong"
                  color={isRide ? colors.onAccentLight : colors.textPrimary}
                  style={styles.badgeLabel}
                >
                  {isRide ? 'Balade' : 'Itinéraire'}
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
            <View style={styles.nameRow}>
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                onEndEditing={commitName}
                accessibilityLabel={isRide ? 'Nom de la balade' : "Nom de l'itinéraire"}
                placeholder={isRide ? 'Nom de la balade' : "Nom de l'itinéraire"}
                placeholderTextColor={colors.textSecondary}
                maxLength={NAME_MAX_LENGTH}
                returnKeyType="done"
                // Un nom propre n'a pas à être "corrigé" : le correcteur
                // remplaçait le nom saisi par sa suggestion à la validation.
                autoCorrect={false}
                selectTextOnFocus
                style={styles.nameInput}
              />
              <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.textSecondary} />
            </View>
            <Text variant="caption" color={colors.textSecondary} style={styles.dateLabel}>
              {formatRideDate(date)}
            </Text>
          </View>

          {mapPath !== undefined ? (
            <View style={styles.mapWrapper}>
              <RideTrackMap path={mapPath} />
            </View>
          ) : null}

          <View style={styles.statsRow}>
            {distanceMeters !== undefined ? (
              <View style={styles.statTile}>
                <Text variant="caption" color={colors.textSecondary} style={styles.statLabel}>
                  Distance
                </Text>
                <Text variant="captionStrong" color={colors.textPrimary} style={styles.statValue}>
                  {formatDistanceKm(distanceMeters)}
                </Text>
              </View>
            ) : null}
            {durationSeconds !== undefined ? (
              <View style={styles.statTile}>
                <Text variant="caption" color={colors.textSecondary} style={styles.statLabel}>
                  Durée
                </Text>
                <Text variant="captionStrong" color={colors.textPrimary} style={styles.statValue}>
                  {formatDuration(durationSeconds)}
                </Text>
              </View>
            ) : null}
            {isRide ? (
              <View style={styles.statTile}>
                <Text variant="caption" color={colors.textSecondary} style={styles.statLabel}>
                  Vit. moy.
                </Text>
                <Text variant="captionStrong" color={colors.textPrimary} style={styles.statValue}>
                  {`${formatSpeedKmhValue(item.ride.summary.averageSpeedMps)} km/h`}
                </Text>
              </View>
            ) : null}
            {isRide ? (
              <View style={styles.statTile}>
                <Text variant="caption" color={colors.textSecondary} style={styles.statLabel}>
                  Dénivelé
                </Text>
                <Text variant="captionStrong" color={colors.textPrimary} style={styles.statValue}>
                  {`${formatElevationMeters(item.ride.summary.elevationGainMeters)} m`}
                </Text>
              </View>
            ) : null}
            {avoidHighways ? (
              <View style={styles.statTile}>
                <Text variant="caption" color={colors.textSecondary} style={styles.statLabel}>
                  Option
                </Text>
                <Text variant="captionStrong" color={colors.textPrimary} style={styles.statValue}>
                  Sans autoroute
                </Text>
              </View>
            ) : null}
          </View>

          {recapSteps.length > 0 ? (
            <View style={styles.section}>
              <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
                Parcours
              </Text>
              <ItineraryRecap steps={recapSteps} />
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Lancer"
              onPress={() => {
                onLaunch(geometry);
              }}
              style={({ pressed }) => [styles.primaryButton, pressed ? styles.pressed : null]}
            >
              <MaterialCommunityIcons
                name={isRide ? 'replay' : 'navigation-variant'}
                size={ICON_SIZE}
                color={colors.onAccentLight}
              />
              <Text variant="captionStrong" color={colors.onAccentLight} style={styles.primaryButtonLabel}>
                {isRide ? 'Refaire le trajet' : 'Lancer'}
              </Text>
            </Pressable>
            <View style={styles.secondaryRow}>
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
                <Text variant="captionStrong" style={styles.secondaryButtonLabel}>
                  {isFavorite ? 'Favori' : 'Ajouter aux favoris'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Exporter au format GPX"
                accessibilityState={{ disabled: isExportingGpx || geometry === undefined }}
                disabled={isExportingGpx || geometry === undefined}
                onPress={handleExportGpx}
                style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
              >
                <MaterialCommunityIcons name="share-variant-outline" size={ICON_SIZE} color={colors.textPrimary} />
                <Text variant="captionStrong" style={styles.secondaryButtonLabel}>
                  Exporter en GPX
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Suppression à part, tout en bas et en toutes lettres : séparée
              des actions courantes pour ne pas être touchée par erreur, et
              sans ambiguïté sur ce qu'elle fait (une confirmation suit). */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Supprimer ${name}`}
            onPress={handleDelete}
            style={({ pressed }) => [styles.deleteButton, pressed ? styles.pressed : null]}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={ICON_SIZE} color={colors.onDangerContainer} />
            <Text variant="captionStrong" color={colors.onDangerContainer} style={styles.secondaryButtonLabel}>
              {isRide ? 'Supprimer la balade' : "Supprimer l'itinéraire"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}
