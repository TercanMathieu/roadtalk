import { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  AddressSuggestionDto,
  AiRouteDto,
  GenerateAiRouteRequestDto,
} from '@roadtalk/contracts';
import { degrees } from '@roadtalk/domain-shared';
import { Redirect, router } from 'expo-router';
import type React from 'react';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, Snackbar, spacing, Text, useSnackbar } from '../../ui';
import { withFreshAccessToken } from '../auth/auth.store';
import { RideTrackMap } from '../ride-summary/RideTrackMap';
import { formatDistanceKm, formatDuration } from '../routing/format';
import { saveRoute } from '../saved-routes/api';
import { usePendingRouteLaunchStore } from '../saved-routes/pendingRouteLaunch.store';
import { type ChosenPlaces, useAiRouteStore } from './aiRoute.store';
import { styles } from './AiRoutePreviewScreen.styles';

const ROUTE_NAME_MAX_LENGTH = 120;

interface Step {
  readonly label: string;
  readonly detail: string | null;
}

// Dernier arrêt, quand il ne fait pas partie des lieux proposés : le départ
// pour une boucle, l'arrivée imposée sinon.
function finalStop(
  route: AiRouteDto,
  request: GenerateAiRouteRequestDto,
  places: ChosenPlaces,
): AddressSuggestionDto | undefined {
  switch (route.ending) {
    case 'start':
      return { label: 'Retour au départ', context: null, ...request.origin };
    case 'destination':
      return request.destination === undefined
        ? undefined
        : {
            label: places.destination?.label ?? 'Arrivée',
            context: places.destination?.context ?? null,
            ...request.destination,
          };
    case 'last-waypoint':
      return undefined;
  }
}

function toSteps(
  route: AiRouteDto,
  request: GenerateAiRouteRequestDto,
  places: ChosenPlaces,
): readonly Step[] {
  const final = finalStop(route, request, places);
  return [
    { label: places.start?.label ?? 'Ta position', detail: 'Départ' },
    ...route.waypoints.map((waypoint) => ({
      label: waypoint.label,
      detail: waypoint.note.length > 0 ? waypoint.note : waypoint.context,
    })),
    ...(final !== undefined
      ? [{ label: final.label, detail: route.ending === 'destination' ? 'Arrivée' : null }]
      : []),
  ];
}

// Arrêts tels que l'écran carte les attend : les lieux de la proposition,
// puis le retour au départ ou l'arrivée imposée.
function toStops(
  route: AiRouteDto,
  request: GenerateAiRouteRequestDto,
  places: ChosenPlaces,
): readonly AddressSuggestionDto[] {
  const final = finalStop(route, request, places);
  return [
    ...route.waypoints.map(({ label, context, latitude, longitude }) => ({
      label,
      context,
      latitude,
      longitude,
    })),
    ...(final !== undefined ? [final] : []),
  ];
}

function remainingLabel(remaining: number): string {
  if (remaining === 0) {
    return 'Dernière proposition du jour';
  }
  return remaining === 1
    ? 'Encore 1 proposition possible aujourd’hui'
    : `Encore ${String(remaining)} propositions possibles aujourd’hui`;
}

export function AiRoutePreviewScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const snackbar = useSnackbar();
  const route = useAiRouteStore((state) => state.route);
  const request = useAiRouteStore((state) => state.request);
  const places = useAiRouteStore((state) => state.places);
  const isGenerating = useAiRouteStore((state) => state.isGenerating);
  const generate = useAiRouteStore((state) => state.generate);
  // La proposition enregistrée, et non un simple booléen : une nouvelle
  // proposition n'est pas enregistrée, même si la précédente l'était.
  const [savedRoute, setSavedRoute] = useState<AiRouteDto | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);

  if (route === undefined || request === undefined) {
    return <Redirect href="/ai-route-generator" />;
  }

  const isSaved = savedRoute === route;
  const steps = toSteps(route, request, places);
  const stops = toStops(route, request, places);
  const path = route.geometry.path.map((point) => ({
    latitude: degrees(point.latitude),
    longitude: degrees(point.longitude),
  }));

  const handleLaunch = (): void => {
    usePendingRouteLaunchStore.getState().setPending({
      stops,
      avoidHighways: route.avoidHighways,
      // Départ choisi dans le formulaire : la carte le garde comme départ fixe,
      // comme pour un itinéraire préparé depuis un autre point.
      ...(places.start !== undefined ? { origin: places.start } : {}),
      labelled: true,
    });
    router.dismissTo('/');
  };

  const handleSave = (): void => {
    if (isSaved || isSaving) {
      return;
    }
    setIsSaving(true);
    withFreshAccessToken((accessToken) =>
      saveRoute(accessToken, {
        name: route.title.slice(0, ROUTE_NAME_MAX_LENGTH),
        waypoints: [request.origin, ...stops].map(({ latitude, longitude }) => ({
          latitude,
          longitude,
        })),
        avoidHighways: route.avoidHighways,
        fixedStart: places.start !== undefined,
        distanceMeters: route.geometry.distanceMeters,
        durationSeconds: route.geometry.durationSeconds,
      }),
    )
      .then(() => {
        setSavedRoute(route);
        snackbar.show('Itinéraire enregistré dans tes balades');
      })
      .catch(() => {
        snackbar.show('Enregistrement impossible. Réessaie.');
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleRegenerate = (): void => {
    if (isGenerating) {
      return;
    }
    generate(request, places).catch((error: unknown) => {
      if (error instanceof Error) {
        snackbar.show(error.message);
      }
    });
  };

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
          style={styles.headerButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
        </Pressable>
        <Text variant="title" style={styles.headerTitle}>
          Proposition
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isSaved ? 'Itinéraire enregistré' : 'Enregistrer l’itinéraire'}
          accessibilityState={{ disabled: isSaved || isSaving, busy: isSaving }}
          hitSlop={8}
          onPress={handleSave}
          style={styles.headerButton}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <MaterialCommunityIcons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isSaved ? colors.accent : colors.textPrimary}
            />
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <Text variant="title" style={styles.routeTitle}>
            {route.title}
          </Text>
          {route.summary.length > 0 ? (
            <Text variant="body" color={colors.textSecondary}>
              {route.summary}
            </Text>
          ) : null}
          <View style={styles.summaryStats}>
            <Text variant="title" tabularNums style={styles.summaryDuration}>
              {formatDuration(route.geometry.durationSeconds)}
            </Text>
            <Text
              variant="body"
              color={colors.textSecondary}
              tabularNums
              style={styles.summaryDetails}
            >
              {formatDistanceKm(route.geometry.distanceMeters)}
            </Text>
          </View>
          <View style={styles.highlightsRow}>
            <Highlight label={route.ending === 'start' ? 'Boucle' : 'Aller simple'} />
            {route.avoidHighways ? <Highlight label="Sans autoroute" /> : null}
          </View>
        </View>

        <View style={styles.mapCard}>
          <RideTrackMap path={path} />
        </View>

        <View style={styles.section}>
          <Text variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
            Étapes
          </Text>
          <View style={styles.card}>
            {steps.map((step, index) => {
              const isLast = index === steps.length - 1;
              return (
                <View key={`${String(index)}-${step.label}`} style={styles.waypointRow}>
                  <View style={styles.waypointRail}>
                    <View style={[styles.waypointDot, isLast ? styles.waypointDotEnd : null]} />
                    {!isLast ? <View style={styles.waypointConnector} /> : null}
                  </View>
                  <View style={[styles.waypointTexts, isLast ? styles.waypointTextsLast : null]}>
                    <Text variant="body" numberOfLines={1}>
                      {step.label}
                    </Text>
                    {step.detail !== null ? (
                      <Text variant="caption" color={colors.textSecondary} numberOfLines={2}>
                        {step.detail}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Text variant="caption" color={colors.textSecondary} style={styles.footerHint}>
          {isGenerating
            ? 'Nouvelle proposition en cours, jusqu’à une minute.'
            : remainingLabel(route.remainingToday)}
        </Text>
        <View style={styles.footerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Autre proposition"
            accessibilityState={{
              disabled: isGenerating || route.remainingToday === 0,
              busy: isGenerating,
            }}
            disabled={isGenerating || route.remainingToday === 0}
            onPress={handleRegenerate}
            style={({ pressed }) => [
              styles.secondaryButton,
              route.remainingToday === 0 ? styles.buttonDisabled : null,
              pressed ? styles.pressed : null,
            ]}
          >
            {isGenerating ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <MaterialCommunityIcons name="refresh" size={22} color={colors.textPrimary} />
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lancer le guidage"
            disabled={isGenerating}
            onPress={handleLaunch}
            style={({ pressed }) => [
              styles.launchButton,
              isGenerating ? styles.buttonDisabled : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text variant="title" color={colors.onAccentLight} style={styles.launchButtonLabel}>
              Lancer le guidage
            </Text>
            <MaterialCommunityIcons
              name="navigation-variant"
              size={20}
              color={colors.onAccentLight}
            />
          </Pressable>
        </View>
      </View>

      <View style={[styles.snackbarWrapper, { bottom: insets.bottom + 112 }]}>
        <Snackbar message={snackbar.message} />
      </View>
    </View>
  );
}

function Highlight({ label }: { readonly label: string }): React.JSX.Element {
  return (
    <View style={styles.highlightChip}>
      <Text variant="caption" color={colors.textPrimary}>
        {label}
      </Text>
    </View>
  );
}
