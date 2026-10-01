import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, MockBanner, Snackbar, spacing, Text, useSnackbar } from '../../ui';
import { styles } from './AiRoutePreviewScreen.styles';

const ICON_SIZE = 18;
const COMING_SOON_MESSAGE = "Fonctionnalité bientôt disponible.";
// Lancer un vrai guidage sur un trajet fictif serait dangereux — ce bouton
// ne doit jamais démarrer de navigation réelle tant que la génération
// elle-même n'existe pas.
const GUIDANCE_UNAVAILABLE_MESSAGE = "Aucun itinéraire réel à suivre — génération IA pas encore construite.";

// Exemple de sortie illustrative : forme à quoi ressemblerait le résultat
// d'une génération IA, aucune des valeurs ci-dessous ne provient d'un calcul
// réel (voir MockBanner). Figé en constantes plutôt qu'en state, puisque
// rien ici n'est modifiable par l'utilisateur.
const SAMPLE = {
  generationNumber: 408,
  title: 'Boucle IA : Les Balcons du Vercors & Combe Laval',
  region: 'Vercors Sauvage',
  distanceKm: 164,
  durationLabel: '3h15',
  paceLabel: 'Allure souple',
  curveRating: 5,
  curveDescription: '84 lacets serrés',
  elevationGainM: 1920,
  surfaceGoodPercent: 92,
  openPasses: 2,
  elevationProfile: [24, 30, 42, 58, 70, 88, 100, 82, 60, 44, 36, 28, 24],
};

interface Waypoint {
  readonly icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  readonly title: string;
  readonly km: number;
  readonly note: string;
  readonly isEnd?: boolean;
}

const WAYPOINTS: readonly Waypoint[] = [
  { icon: 'gas-station-outline', title: 'Départ : Grenoble Sud', km: 0, note: 'Plein carburant recommandé' },
  { icon: 'terrain', title: 'Gorges du Nan', km: 42, note: 'Route taillée dans la falaise, vue falaise' },
  { icon: 'image-filter-hdr', title: 'Col de Romeyère', km: 78, note: 'Altitude 1069 m, goudron neuf' },
  { icon: 'coffee-outline', title: 'Le Belvédère Motard', km: 112, note: 'Pause suggérée, parking moto dédié' },
  { icon: 'flag-checkered', title: 'Arrivée : Grenoble Sud', km: 164, note: 'Fin de la boucle', isEnd: true },
];

// Aucun moteur de génération d'itinéraire n'existe (voir
// AiRouteGeneratorScreen) : cet écran montre à quoi ressemblerait un résultat
// — nom de lieux, photos de segments et tracé compris — avec des données
// entièrement fictives. Remplacer la carte réelle et les photos de segments
// par de vraies données géographiques inventées (plutôt que des placeholders
// neutres) serait plus trompeur qu'utile, donc volontairement évité ici.
export function AiRoutePreviewScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const snackbar = useSnackbar();
  const maxElevation = Math.max(...SAMPLE.elevationProfile);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}>
        <MockBanner message="Aperçu — exemple illustratif, aucun itinéraire n'a réellement été généré." />

        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={8}
            onPress={() => {
              router.back();
            }}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="chevron-left" size={26} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.iaBadge}>
            <View style={styles.iaBadgeDot} />
            <Text variant="mono" color={colors.textPrimary}>
              IA 1.2S · HORS-LIGNE 24 MO
            </Text>
          </View>
        </View>

        <View style={styles.previewPanel}>
          <View style={styles.previewPanelTag}>
            <MaterialCommunityIcons name="routes" size={20} color={colors.accent} />
            <View style={styles.previewPanelTagTexts}>
              <Text variant="body" style={styles.previewPanelTitle}>
                Boucle optimisée virages
              </Text>
              <Text variant="mono" color={colors.textDense}>
                {SAMPLE.region} · 5 étapes validées
              </Text>
            </View>
            <View style={styles.previewPanelSurface}>
              <Text variant="monoBold" color={colors.accent} style={styles.previewPanelSurfaceValue}>
                100%
              </Text>
              <Text variant="mono" color={colors.accent}>
                GOUDRON
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.titleSection}>
          <View style={styles.titleTagRow}>
            <View style={styles.recommendedTag}>
              <Text variant="monoBold" color={colors.onAccentLight}>
                RECOMMANDÉ
              </Text>
            </View>
            <Text variant="mono" color={colors.textDense}>
              GÉNÉRATION #{SAMPLE.generationNumber}
            </Text>
          </View>
          <Text variant="title" style={styles.routeTitle}>
            {SAMPLE.title}
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricTile}>
            <View style={styles.metricTileHeader}>
              <Text variant="label" color={colors.textDense} style={styles.metricLabel}>
                DISTANCE
              </Text>
              <MaterialCommunityIcons name="map-marker-distance" size={14} color={colors.textDense} />
            </View>
            <View style={styles.metricValueRow}>
              <Text variant="title" tabularNums style={styles.metricValue}>
                {SAMPLE.distanceKm}
              </Text>
              <Text variant="mono" color={colors.textDense}>
                KM
              </Text>
            </View>
          </View>

          <View style={styles.metricTile}>
            <View style={styles.metricTileHeader}>
              <Text variant="label" color={colors.textDense} style={styles.metricLabel}>
                TEMPS ESTIMÉ
              </Text>
              <MaterialCommunityIcons name="clock-time-four-outline" size={14} color={colors.textDense} />
            </View>
            <View style={styles.metricValueRow}>
              <Text variant="title" tabularNums style={styles.metricValue}>
                {SAMPLE.durationLabel}
              </Text>
              <Text variant="mono" color={colors.accent}>
                {SAMPLE.paceLabel}
              </Text>
            </View>
          </View>

          <View style={styles.metricTile}>
            <View style={styles.metricTileHeader}>
              <Text variant="label" color={colors.textDense} style={styles.metricLabel}>
                INDICE VIRAGES
              </Text>
              <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={14} color={colors.textDense} />
            </View>
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }, (_, index) => (
                <MaterialCommunityIcons
                  key={index}
                  name={index < SAMPLE.curveRating ? 'star' : 'star-outline'}
                  size={15}
                  color={colors.accent}
                />
              ))}
            </View>
            <Text variant="mono" color={colors.accentLight}>
              {SAMPLE.curveDescription}
            </Text>
          </View>

          <View style={styles.metricTile}>
            <View style={styles.metricTileHeader}>
              <Text variant="label" color={colors.textDense} style={styles.metricLabel}>
                DÉNIVELÉ
              </Text>
              <MaterialCommunityIcons name="elevation-rise" size={14} color={colors.textDense} />
            </View>
            <View style={styles.metricValueRow}>
              <Text variant="title" tabularNums style={styles.metricValue}>
                +{SAMPLE.elevationGainM.toLocaleString('fr-FR')}
              </Text>
              <Text variant="mono" color={colors.textDense}>
                M
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderTitle}>
              <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={ICON_SIZE} color={colors.textPrimary} />
              <Text variant="title" style={styles.cardHeaderLabel}>
                Courbure et dénivelé
              </Text>
            </View>
            <Text variant="mono" color={colors.textDense}>
              Profil altimétrique
            </Text>
          </View>

          <View style={styles.elevationChart}>
            {SAMPLE.elevationProfile.map((value, index) => (
              <View
                key={index}
                style={[styles.elevationBar, { height: Math.max(6, (value / maxElevation) * 80) }]}
              />
            ))}
          </View>

          <View style={styles.elevationAxis}>
            <Text variant="mono" color={colors.textDense}>
              0 km (240 m)
            </Text>
            <Text variant="monoBold" color={colors.accent}>
              Col 1069 m
            </Text>
            <Text variant="mono" color={colors.textDense}>
              {SAMPLE.distanceKm} km (240 m)
            </Text>
          </View>

          <View style={styles.highlightsList}>
            <View style={styles.highlightChip}>
              <MaterialCommunityIcons name="road-variant" size={16} color={colors.textPrimary} />
              <Text variant="mono" color={colors.textPrimary}>
                {SAMPLE.surfaceGoodPercent}% asphalte parfait
              </Text>
            </View>
            <View style={styles.highlightChip}>
              <MaterialCommunityIcons name="cash-off" size={16} color={colors.textPrimary} />
              <Text variant="mono" color={colors.textPrimary}>
                0 péage, 0 autoroute
              </Text>
            </View>
            <View style={styles.highlightChip}>
              <MaterialCommunityIcons name="image-filter-hdr" size={16} color={colors.textPrimary} />
              <Text variant="mono" color={colors.textPrimary}>
                {SAMPLE.openPasses} cols ouverts
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.segmentsSection}>
          <Text variant="label" color={colors.textDense} style={styles.segmentsLabel}>
            APERÇU VISUEL DES SEGMENTS
          </Text>
          <View style={styles.segmentsRow}>
            <View style={styles.segmentCard}>
              <MaterialCommunityIcons name="image-off-outline" size={28} color={colors.textDense} />
              <Text variant="mono" color={colors.textDense} style={styles.segmentCardLabel}>
                Gorges du Nan
              </Text>
            </View>
            <View style={styles.segmentCard}>
              <MaterialCommunityIcons name="image-off-outline" size={28} color={colors.textDense} />
              <Text variant="mono" color={colors.textDense} style={styles.segmentCardLabel}>
                Col de Romeyère
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text variant="title" style={styles.cardHeaderLabel}>
              Feuille de route IA
            </Text>
            <Text variant="mono" color={colors.textDense}>
              {WAYPOINTS.length} waypoints
            </Text>
          </View>

          <View style={styles.waypointsList}>
            {WAYPOINTS.map((waypoint, index) => (
              <View key={waypoint.title} style={styles.waypointRow}>
                <View style={styles.waypointRail}>
                  <View style={[styles.waypointDot, waypoint.isEnd === true ? styles.waypointDotEnd : null]}>
                    <MaterialCommunityIcons
                      name={waypoint.icon}
                      size={14}
                      color={waypoint.isEnd === true ? colors.onAccentLight : colors.textPrimary}
                    />
                  </View>
                  {index < WAYPOINTS.length - 1 ? <View style={styles.waypointConnector} /> : null}
                </View>
                <View style={styles.waypointTexts}>
                  <View style={styles.waypointHeaderRow}>
                    <Text variant="body" style={styles.waypointTitle}>
                      {waypoint.title}
                    </Text>
                    <Text variant="mono" color={colors.textDense}>
                      {waypoint.km === 0 ? '0 km' : `km ${String(waypoint.km)}`}
                    </Text>
                  </View>
                  <Text variant="mono" color={colors.accentLight}>
                    {waypoint.note}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.secondaryActionsRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Variante IA"
            onPress={() => {
              snackbar.show(COMING_SOON_MESSAGE);
            }}
            style={styles.secondaryActionButton}
          >
            <MaterialCommunityIcons name="swap-horizontal" size={ICON_SIZE} color={colors.textPrimary} />
            <Text variant="body">Variante IA</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ajuster les virages"
            onPress={() => {
              snackbar.show(COMING_SOON_MESSAGE);
            }}
            style={styles.secondaryActionButton}
          >
            <MaterialCommunityIcons name="tune-variant" size={ICON_SIZE} color={colors.textPrimary} />
            <Text variant="body">Virages ±</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lancer le guidage"
          onPress={() => {
            snackbar.show(GUIDANCE_UNAVAILABLE_MESSAGE);
          }}
          style={({ pressed }) => [styles.launchButton, pressed ? styles.launchButtonPressed : null]}
        >
          <MaterialCommunityIcons name="navigation-variant" size={28} color={colors.onAccentLight} />
          <View style={styles.launchButtonTexts}>
            <Text variant="title" color={colors.onAccentLight} style={styles.launchButtonTitle}>
              Lancer le guidage
            </Text>
            <Text variant="mono" color={colors.onAccentLight} style={styles.launchButtonCaption}>
              Mode hors-ligne · Audio casque actif
            </Text>
          </View>
          <Text variant="monoBold" color={colors.onAccentLight} style={styles.launchButtonDistance}>
            {SAMPLE.distanceKm} KM
          </Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.snackbarWrapper, { bottom: insets.bottom + spacing.sm }]}>
        <Snackbar message={snackbar.message} />
      </View>
    </View>
  );
}
