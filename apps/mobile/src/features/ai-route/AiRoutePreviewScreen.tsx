import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, MockBanner, Snackbar, spacing, Text, useSnackbar } from '../../ui';
import { styles } from './AiRoutePreviewScreen.styles';

// Lancer un vrai guidage sur un trajet fictif serait dangereux — ce bouton
// ne doit jamais démarrer de navigation réelle tant que la génération
// elle-même n'existe pas.
const GUIDANCE_UNAVAILABLE_MESSAGE = 'Exemple illustratif — aucun itinéraire réel à suivre.';

const ELEVATION_CHART_HEIGHT = 72;
const ELEVATION_BAR_MIN_HEIGHT = 6;

// Exemple de sortie illustrative : la forme qu'aurait le résultat d'une
// génération IA, aucune des valeurs ci-dessous ne provient d'un calcul réel
// (voir MockBanner). Figé en constantes plutôt qu'en state, puisque rien ici
// n'est modifiable par l'utilisateur.
const SAMPLE = {
  title: 'Balcons du Vercors',
  subtitle: 'Boucle · départ Grenoble Sud',
  durationLabel: '3 h 15',
  distanceKm: 164,
  elevationGainM: 1920,
  highlights: ['Sans autoroute', '2 cols', 'Sans péage'],
  elevationProfile: [24, 30, 42, 58, 70, 88, 100, 82, 60, 44, 36, 28, 24],
};

interface Waypoint {
  readonly title: string;
  readonly km: number;
  readonly note: string;
}

const WAYPOINTS: readonly Waypoint[] = [
  { title: 'Grenoble Sud', km: 0, note: 'Départ' },
  { title: 'Gorges du Nan', km: 42, note: 'Route en corniche' },
  { title: 'Col de Romeyère', km: 78, note: '1 069 m' },
  { title: 'Pause café', km: 112, note: 'Halte suggérée' },
  { title: 'Grenoble Sud', km: 164, note: 'Arrivée' },
];

// Aucun moteur de génération d'itinéraire n'existe (voir
// AiRouteGeneratorScreen) : cet écran montre à quoi ressemblerait un
// résultat, avec des données entièrement fictives. Volontairement sans carte
// ni photo : un tracé ou des images inventés seraient plus trompeurs
// qu'utiles.
export function AiRoutePreviewScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const snackbar = useSnackbar();
  const maxElevation = Math.max(...SAMPLE.elevationProfile);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          onPress={() => {
            router.back();
          }}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text variant="title" style={styles.headerTitle}>
          Proposition
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <MockBanner message="Exemple illustratif — aucun itinéraire n'a réellement été généré." />

        <View style={styles.summary}>
          <Text variant="title" style={styles.routeTitle}>
            {SAMPLE.title}
          </Text>
          <Text variant="body" color={colors.textSecondary}>
            {SAMPLE.subtitle}
          </Text>
          <View style={styles.summaryStats}>
            <Text variant="title" tabularNums style={styles.summaryDuration}>
              {SAMPLE.durationLabel}
            </Text>
            <Text variant="body" color={colors.textSecondary} tabularNums style={styles.summaryDetails}>
              {`${String(SAMPLE.distanceKm)} km · +${SAMPLE.elevationGainM.toLocaleString('fr-FR')} m`}
            </Text>
          </View>
          <View style={styles.highlightsRow}>
            {SAMPLE.highlights.map((highlight) => (
              <View key={highlight} style={styles.highlightChip}>
                <Text variant="caption" color={colors.textPrimary}>
                  {highlight}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
            Profil
          </Text>
          <View style={styles.card}>
            <View style={styles.elevationChart}>
              {SAMPLE.elevationProfile.map((value, index) => (
                <View
                  key={index}
                  style={[
                    styles.elevationBar,
                    value === maxElevation ? styles.elevationBarPeak : null,
                    {
                      height: Math.max(ELEVATION_BAR_MIN_HEIGHT, (value / maxElevation) * ELEVATION_CHART_HEIGHT),
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.elevationAxis}>
              <Text variant="caption" color={colors.textSecondary}>
                0 km
              </Text>
              <Text variant="caption" color={colors.textSecondary}>
                {`${String(SAMPLE.distanceKm)} km`}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
            Étapes
          </Text>
          <View style={styles.card}>
            {WAYPOINTS.map((waypoint, index) => {
              const isLast = index === WAYPOINTS.length - 1;
              return (
                <View key={`${String(index)}-${waypoint.title}`} style={styles.waypointRow}>
                  <View style={styles.waypointRail}>
                    <View style={[styles.waypointDot, isLast ? styles.waypointDotEnd : null]} />
                    {!isLast ? <View style={styles.waypointConnector} /> : null}
                  </View>
                  <View style={[styles.waypointTexts, isLast ? styles.waypointTextsLast : null]}>
                    <Text variant="body" numberOfLines={1}>
                      {waypoint.title}
                    </Text>
                    <Text variant="caption" color={colors.textSecondary}>
                      {waypoint.note}
                    </Text>
                  </View>
                  <Text variant="caption" color={colors.textSecondary} tabularNums>
                    {`${String(waypoint.km)} km`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lancer le guidage"
          onPress={() => {
            snackbar.show(GUIDANCE_UNAVAILABLE_MESSAGE);
          }}
          style={({ pressed }) => [styles.launchButton, pressed ? styles.pressed : null]}
        >
          <Text variant="title" color={colors.onAccentLight} style={styles.launchButtonLabel}>
            Lancer le guidage
          </Text>
          <MaterialCommunityIcons name="navigation-variant" size={20} color={colors.onAccentLight} />
        </Pressable>
      </View>

      <View style={[styles.snackbarWrapper, { bottom: insets.bottom + 80 }]}>
        <Snackbar message={snackbar.message} />
      </View>
    </View>
  );
}
