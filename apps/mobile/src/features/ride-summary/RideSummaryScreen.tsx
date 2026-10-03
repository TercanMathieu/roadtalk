import { MaterialCommunityIcons } from '@expo/vector-icons';
import type React from 'react';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, Snackbar, spacing, Text, useSnackbar } from '../../ui';
import { withFreshAccessToken } from '../auth/auth.store';
import { saveRide } from '../history/api';
import { formatDuration } from '../routing/format';
import {
  formatClockTime,
  formatDistanceKmValue,
  formatElevationMeters,
  formatPercent,
  formatSpeedKmhValue,
} from './format';
import { exportTrackAsGpx } from './gpx-export';
import { styles } from './RideSummaryScreen.styles';
import { RideTrackMap } from './RideTrackMap';
import type { RideSummary } from './summarize-track';
import type { TrackPoint } from './track-point';

const ICON_SIZE = 18;
const COMING_SOON_MESSAGE = 'Fonctionnalité bientôt disponible.';
const GPX_EXPORT_FAILED_MESSAGE = "L'export GPX a échoué.";
const RIDE_SAVED_MESSAGE = 'Balade sauvegardée dans l’historique.';
const RIDE_SAVE_FAILED_MESSAGE = 'La sauvegarde a échoué.';

interface Props {
  readonly summary: RideSummary;
  readonly points: readonly TrackPoint[];
  readonly onClose: () => void;
}

function defaultRideName(startedAt: number): string {
  return `Balade du ${new Date(startedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' })}`;
}

// Modal toujours monté avec `visible` à vrai : affiché/masqué en montant ou
// démontant ce composant depuis MapScreen, pas de prop `visible` séparée
// (pas besoin de garder le dernier résumé en mémoire une fois fermé).
export function RideSummaryScreen({ summary, points, onClose }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const snackbar = useSnackbar();
  const first = points[0];
  const last = points[points.length - 1];
  const [rideName, setRideName] = useState(() => defaultRideName(first?.recordedAt ?? Date.now()));
  const [isExportingGpx, setIsExportingGpx] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleExportGpx = (): void => {
    setIsExportingGpx(true);
    exportTrackAsGpx(rideName, points)
      .catch(() => {
        snackbar.show(GPX_EXPORT_FAILED_MESSAGE);
      })
      .finally(() => {
        setIsExportingGpx(false);
      });
  };

  const handleSaveToHistory = (): void => {
    if (first === undefined || last === undefined) {
      return;
    }

    setIsSaving(true);
    withFreshAccessToken((accessToken) =>
      saveRide(accessToken, {
        name: rideName,
        startedAt: first.recordedAt,
        endedAt: last.recordedAt,
        track: points,
      }),
    )
      .then(() => {
        setIsSaved(true);
        snackbar.show(RIDE_SAVED_MESSAGE);
      })
      .catch(() => {
        snackbar.show(RIDE_SAVE_FAILED_MESSAGE);
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.banner}>
            <View style={styles.bannerIcon}>
              <MaterialCommunityIcons name="flag-checkered" size={ICON_SIZE} color={colors.accent} />
            </View>
            <View style={styles.bannerTexts}>
              <Text variant="title" style={styles.bannerTitle}>
                Balade terminée !
              </Text>
              <Text variant="body" color={colors.textSecondary}>
                Voici le résumé de ta balade
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer le résumé"
              hitSlop={8}
              onPress={onClose}
              style={styles.closeButton}
            >
              <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.mapCard}>
            <RideTrackMap path={points.map((point) => point.position)} />
            <View style={styles.gpsFixBadge}>
              <View style={styles.gpsFixDot} />
              <Text variant="label" color={colors.accentLight}>
                FIX GPS {formatPercent(summary.usableFixRatio)}
              </Text>
            </View>
            <View style={styles.mapLegend}>
              <View style={styles.legendChip}>
                <View style={[styles.legendDot, { backgroundColor: colors.textPrimary }]} />
                <Text variant="label" color={colors.textSecondary}>
                  Départ
                </Text>
              </View>
              <View style={styles.legendChip}>
                <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                <Text variant="label" color={colors.textSecondary}>
                  Arrivée
                </Text>
              </View>
            </View>

            <View style={styles.titleSection}>
              <TextInput
                value={rideName}
                onChangeText={setRideName}
                style={styles.titleInput}
                placeholder="Nom de la balade"
                placeholderTextColor={colors.textSecondary}
              />
              {first !== undefined && last !== undefined ? (
                <View style={styles.timestampRow}>
                  <MaterialCommunityIcons name="clock-outline" size={15} color={colors.textSecondary} />
                  <Text variant="caption" color={colors.textSecondary}>
                    {`${formatClockTime(first.recordedAt)} - ${formatClockTime(last.recordedAt)} (${formatDuration(summary.durationSeconds)})`}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.statsSection}>
            <View style={styles.statsHeader}>
              <Text variant="label" color={colors.textSecondary}>
                Résumé
              </Text>
            </View>

            <View style={styles.distanceCard}>
              <View>
                <Text variant="label" color={colors.textSecondary}>
                  Distance
                </Text>
                <View style={styles.distanceValueRow}>
                  <Text variant="display" style={styles.distanceValue}>
                    {formatDistanceKmValue(summary.distanceMeters)}
                  </Text>
                  <Text variant="title" color={colors.textSecondary} style={styles.distanceUnit}>
                    km
                  </Text>
                </View>
              </View>
              <View style={styles.distanceIcon}>
                <MaterialCommunityIcons name="map-marker-distance" size={26} color={colors.textPrimary} />
              </View>
            </View>

            <View style={styles.statsGrid}>
              <StatTile label="Vitesse moyenne" value={formatSpeedKmhValue(summary.averageSpeedMps)} unit="km/h" />
              <StatTile
                label="Vitesse max"
                value={formatSpeedKmhValue(summary.maxSpeedMps)}
                unit="km/h"
                icon="speedometer"
              />
              <StatTile
                label="Dénivelé positif"
                value={formatElevationMeters(summary.elevationGainMeters)}
                unit="m"
                icon="trending-up"
              />
              <StatTile
                label="À l'arrêt"
                value={formatDuration(summary.stoppedSeconds)}
                icon="coffee-outline"
              />
            </View>
          </View>

          <View style={styles.notesCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ajouter une note sur les conditions"
              onPress={() => {
                snackbar.show(COMING_SOON_MESSAGE);
              }}
              style={({ pressed }) => [styles.notesRow, pressed ? styles.rowPressed : null]}
            >
              <View style={styles.notesIcon}>
                <MaterialCommunityIcons name="motorbike" size={ICON_SIZE} color={colors.textPrimary} />
              </View>
              <View style={styles.notesTexts}>
                <Text variant="body">Conditions de route</Text>
                <Text variant="caption" color={colors.textSecondary}>
                  Ajouter une note (météo, revêtement…)
                </Text>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Photos"
              onPress={() => {
                snackbar.show(COMING_SOON_MESSAGE);
              }}
              style={({ pressed }) => [styles.photosButton, pressed ? styles.rowPressed : null]}
            >
              <MaterialCommunityIcons name="image-multiple-outline" size={16} color={colors.textSecondary} />
              <Text variant="label" color={colors.textSecondary}>
                Photos
              </Text>
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Exporter la trace GPX"
              accessibilityState={{ disabled: isExportingGpx }}
              disabled={isExportingGpx}
              onPress={handleExportGpx}
              style={({ pressed }) => [
                styles.primaryAction,
                isExportingGpx ? styles.primaryActionDisabled : null,
                pressed ? styles.rowPressed : null,
              ]}
            >
              <MaterialCommunityIcons name="download-outline" size={ICON_SIZE} color={colors.onAccentLight} />
              <Text variant="title" color={colors.onAccentLight} style={styles.primaryActionLabel}>
                {isExportingGpx ? 'Export…' : 'Exporter la trace GPX'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sauvegarder dans l'historique"
              accessibilityState={{ disabled: isSaving || isSaved || points.length === 0 }}
              disabled={isSaving || isSaved || points.length === 0}
              onPress={handleSaveToHistory}
              style={({ pressed }) => [
                styles.secondaryAction,
                isSaved ? styles.primaryActionDisabled : null,
                pressed ? styles.rowPressed : null,
              ]}
            >
              <MaterialCommunityIcons
                name={isSaved ? 'check-circle-outline' : 'archive-outline'}
                size={ICON_SIZE}
                color={colors.textPrimary}
              />
              <Text variant="title" style={styles.secondaryActionLabel}>
                {isSaved ? 'Sauvegardée' : isSaving ? 'Sauvegarde…' : "Sauvegarder dans l'historique"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        <View style={[styles.snackbarWrapper, { bottom: insets.bottom + spacing.sm }]}>
          <Snackbar message={snackbar.message} />
        </View>
      </View>
    </Modal>
  );
}

interface StatTileProps {
  readonly label: string;
  readonly value: string;
  readonly unit?: string;
  readonly icon?: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}

function StatTile({ label, value, unit, icon }: StatTileProps): React.JSX.Element {
  return (
    <View style={styles.statTile}>
      <View style={styles.statTileHeader}>
        <Text variant="label" color={colors.textSecondary}>
          {label}
        </Text>
        {icon !== undefined ? <MaterialCommunityIcons name={icon} size={14} color={colors.textSecondary} /> : null}
      </View>
      <View style={styles.statValueRow}>
        <Text variant="title" color={colors.textPrimary} style={styles.statValue}>
          {value}
        </Text>
        {unit !== undefined ? (
          <Text variant="label" color={colors.textSecondary}>
            {unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
