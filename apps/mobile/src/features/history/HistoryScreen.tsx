import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { RouteDto } from '@roadtalk/contracts';
import { degrees, type GeoPoint } from '@roadtalk/domain-shared';
import { useRouter } from 'expo-router';
import type React from 'react';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, SegmentedToggle, Snackbar, spacing, Text, useSnackbar } from '../../ui';
import { withFreshAccessToken } from '../auth/auth.store';
import { APP_HEADER_HEIGHT } from '../map/AppHeader.styles';
import { exportTrackAsGpx } from '../ride-summary/gpx-export';
import type { TrackPoint } from '../ride-summary/track-point';
import { computeRoute } from '../routing/api';
import { formatDistanceKm, formatDuration } from '../routing/format';
import { usePendingRouteLaunchStore } from '../saved-routes/pendingRouteLaunch.store';
import { saveRoutesWaypointsToStops } from '../saved-routes/toStops';
import { useSavedRoutes } from '../saved-routes/useSavedRoutes';
import { getRide } from './api';
import { BaladeDetailModal } from './BaladeDetailModal';
import { type BaladeItem, itemDate, itemId } from './baladeItem';
import { CarnetDeRouteCard } from './CarnetDeRouteCard';
import { formatRideDate } from './format';
import { styles } from './HistoryScreen.styles';
import { LastRideHeroCard } from './LastRideHeroCard';
import { toTrackPoints } from './trackPoint';
import { useRideHistory } from './useRideHistory';

const ICON_SIZE = 16;
const GPX_UNAVAILABLE_MESSAGE = 'Import GPX bientôt disponible.';
const GPX_EXPORT_FAILED_MESSAGE = "L'export GPX a échoué.";

type Tab = 'all' | 'favorites' | 'gpxImports';

// Les 3 onglets du mockup Stitch. "Favoris" = tes itinéraires enregistrés
// (les Route, jamais encore roulés). Mettre une balade déjà effectuée en
// avant (isFavorite sur Ride) est une notion complémentaire, pas rattachée à
// cet onglet — voir LastRideHeroCard/BaladeDetailModal. "Imports GPX" est
// honnêtement vide : aucun import GPX n'existe dans l'app.
interface BaladeCardProps {
  readonly item: BaladeItem;
  readonly onPress: () => void;
  readonly onLaunch: () => void;
}

// Même structure visuelle que le mockup (ligne de tags, titre, ligne de
// stats à icônes, action "Lancer") pour les deux types de balades — mais
// le tag de type reste honnête (BALADE / ITINÉRAIRE) plutôt que les
// classifications inventées du mockup ("Col Alpin", "Classique"...) : les
// coller sur un lieu réel en ferait une fausse description, pas juste une
// statistique fictive. Un tap ouvre le détail (BaladeDetailModal) — seule la
// suppression y vit désormais, "Lancer" reste accessible directement ici.
function BaladeCard({ item, onPress, onLaunch }: BaladeCardProps): React.JSX.Element {
  const isRide = item.kind === 'ride';
  const name = isRide
    ? item.ride.name
    : (item.route.name ?? `Itinéraire du ${formatRideDate(item.route.createdAt)}`);
  const date = itemDate(item);
  const distanceMeters = isRide ? item.ride.summary.distanceMeters : item.route.distanceMeters;
  const durationSeconds = isRide ? item.ride.summary.durationSeconds : item.route.durationSeconds;
  const avoidHighways = !isRide && item.route.routingOptions.avoidHighways;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voir le détail de ${name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View style={styles.cardTexts}>
        <View style={styles.cardTagRow}>
          <View style={[styles.cardTag, isRide ? styles.cardTagRide : styles.cardTagRoute]}>
            <MaterialCommunityIcons
              name={isRide ? 'motorbike' : 'map-marker-path'}
              size={11}
              color={isRide ? colors.onAccentLight : colors.textPrimary}
            />
            <Text
              variant="monoBold"
              color={isRide ? colors.onAccentLight : colors.textPrimary}
              style={styles.cardTagLabel}
            >
              {isRide ? 'BALADE' : 'ITINÉRAIRE'}
            </Text>
          </View>
          {avoidHighways ? (
            <View style={styles.cardTag}>
              <Text variant="monoBold" color={colors.textSecondary} style={styles.cardTagLabel}>
                SANS AUTOROUTE
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="title" numberOfLines={1} style={styles.cardName}>
          {name}
        </Text>
        <Text variant="mono" color={colors.textDense} style={styles.cardDate}>
          {formatRideDate(date).toUpperCase()}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <View style={styles.cardStatsCompact}>
          {distanceMeters !== undefined ? (
            <Text variant="body" color={colors.textSecondary} style={styles.cardStat}>
              {formatDistanceKm(distanceMeters)}
            </Text>
          ) : null}
          {durationSeconds !== undefined ? (
            <Text variant="body" color={colors.textSecondary} style={styles.cardStat}>
              {formatDuration(durationSeconds)}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Relancer ${name}`}
          onPress={onLaunch}
          style={({ pressed }) => [styles.launchButton, pressed ? styles.pressed : null]}
        >
          <MaterialCommunityIcons name="navigation-variant" size={ICON_SIZE} color={colors.onAccentLight} />
        </Pressable>
      </View>
    </Pressable>
  );
}

// Bandeau "stockage hors-ligne" du mockup Stitch : AUCUN système de cache
// hors-ligne n'existe dans l'app (voir CLAUDE.md, "Décidé mais pas encore
// construit") — reproduit tel quel à la demande explicite, mais jamais sans
// ce marqueur, sous peine de laisser croire à une vraie autonomie hors-ligne.
function OfflineStorageBanner(): React.JSX.Element {
  return (
    <View style={styles.offlineBanner}>
      <MaterialCommunityIcons name="flask-outline" size={20} color={colors.danger} />
      <Text variant="label" color={colors.danger} style={styles.offlineBannerText}>
        FICTIF — Stockage hors-ligne actif : aucun système de cache hors-ligne n’est construit aujourd’hui.
      </Text>
    </View>
  );
}

export function HistoryScreen(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('all');
  const [latestRidePoints, setLatestRidePoints] = useState<readonly TrackPoint[] | undefined>(undefined);
  const [isExportingGpx, setIsExportingGpx] = useState(false);
  const [selectedItem, setSelectedItem] = useState<BaladeItem | undefined>(undefined);
  const [selectedRidePoints, setSelectedRidePoints] = useState<readonly TrackPoint[] | undefined>(undefined);
  const [selectedRoutePath, setSelectedRoutePath] = useState<readonly GeoPoint[] | undefined>(undefined);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const snackbar = useSnackbar();
  const {
    rides,
    isLoading: isLoadingRides,
    error: ridesError,
    refresh: refreshRides,
    removeRide,
    toggleFavorite,
  } = useRideHistory();
  const {
    routes,
    isLoading: isLoadingRoutes,
    error: routesError,
    refresh: refreshRoutes,
    removeRoute,
  } = useSavedRoutes();

  const latestRide = rides[0];

  // Le détail (tracé complet) n'est pas inclus dans la liste — trop lourd
  // (potentiellement des milliers de points par balade) pour un résumé.
  // Chargé à part, seulement pour la plus récente, affichée en vedette.
  useEffect(() => {
    if (latestRide === undefined) {
      setLatestRidePoints(undefined);
      return;
    }

    let cancelled = false;
    withFreshAccessToken((accessToken) => getRide(accessToken, latestRide.id))
      .then((detail) => {
        if (!cancelled) {
          setLatestRidePoints(toTrackPoints(detail.track));
        }
      })
      .catch(() => {
        // Pas de résumé exploitable sans tracé : la carte vedette masque
        // juste l'aperçu de carte, le reste de ses stats reste affiché.
      });

    return () => {
      cancelled = true;
    };
  }, [latestRide]);

  // Même raison que l'effet ci-dessus, pour la balade ouverte dans
  // BaladeDetailModal (n'importe laquelle, pas seulement la plus récente).
  useEffect(() => {
    if (selectedItem?.kind !== 'ride') {
      setSelectedRidePoints(undefined);
      return;
    }

    let cancelled = false;
    withFreshAccessToken((accessToken) => getRide(accessToken, selectedItem.ride.id))
      .then((detail) => {
        if (!cancelled) {
          setSelectedRidePoints(toTrackPoints(detail.track));
        }
      })
      .catch(() => {
        // Même dégradation que pour la carte vedette : pas de carte, le
        // reste du détail (stats déjà connues côté liste) reste affiché.
      });

    return () => {
      cancelled = true;
    };
  }, [selectedItem]);

  // Un itinéraire enregistré n'a pas de tracé GPS (il n'a jamais été roulé)
  // mais a de vrais waypoints : on redemande au moteur de routage le chemin
  // réel qu'il suivrait (mêmes routes, pas une ligne droite), plutôt que de
  // n'afficher aucune carte dans le détail.
  useEffect(() => {
    if (selectedItem?.kind !== 'route') {
      setSelectedRoutePath(undefined);
      return;
    }

    let cancelled = false;
    const route = selectedItem.route;
    withFreshAccessToken((accessToken) =>
      computeRoute(accessToken, route.waypoints, route.routingOptions.avoidHighways),
    )
      .then((geometry) => {
        if (!cancelled) {
          setSelectedRoutePath(
            geometry.path.map((point) => ({ latitude: degrees(point.latitude), longitude: degrees(point.longitude) })),
          );
        }
      })
      .catch(() => {
        // Pas de tracé exploitable : le détail reste utilisable sans carte,
        // comme pour une balade dont le tracé ne charge pas.
      });

    return () => {
      cancelled = true;
    };
  }, [selectedItem]);

  const handleLaunchRoute = (route: RouteDto): void => {
    usePendingRouteLaunchStore.getState().setPending({
      stops: saveRoutesWaypointsToStops(route.waypoints),
      avoidHighways: route.routingOptions.avoidHighways,
    });
    router.push('/');
  };

  const launchRidePoints = (points: readonly TrackPoint[] | undefined): void => {
    const lastPoint = points?.[points.length - 1];
    if (lastPoint === undefined) {
      return;
    }
    usePendingRouteLaunchStore.getState().setPending({
      stops: [
        {
          label: `${lastPoint.position.latitude.toFixed(4)}, ${lastPoint.position.longitude.toFixed(4)}`,
          context: null,
          latitude: lastPoint.position.latitude,
          longitude: lastPoint.position.longitude,
        },
      ],
      avoidHighways: false,
    });
    router.push('/');
  };

  const handleRelaunchRide = (): void => {
    launchRidePoints(latestRidePoints);
  };

  const handleModalLaunch = (): void => {
    if (selectedItem === undefined) {
      return;
    }
    if (selectedItem.kind === 'route') {
      handleLaunchRoute(selectedItem.route);
    } else {
      launchRidePoints(selectedRidePoints);
    }
    setSelectedItem(undefined);
  };

  const handleExportLatestGpx = (): void => {
    if (latestRide === undefined || latestRidePoints === undefined) {
      return;
    }
    setIsExportingGpx(true);
    exportTrackAsGpx(latestRide.name, latestRidePoints)
      .catch(() => {
        snackbar.show(GPX_EXPORT_FAILED_MESSAGE);
      })
      .finally(() => {
        setIsExportingGpx(false);
      });
  };

  const handleLaunch = (item: BaladeItem): void => {
    if (item.kind === 'route') {
      handleLaunchRoute(item.route);
      return;
    }
    // Relancer une balade effectuée : seul "la plus récente" a son tracé
    // déjà chargé (pour la carte vedette) — les autres lignes de la liste
    // n'ont pas encore téléchargé leur détail, donc pas de relance directe.
    if (item.ride.id === latestRide?.id) {
      handleRelaunchRide();
    }
  };

  const allItems: readonly BaladeItem[] = [
    ...rides.map((ride): BaladeItem => ({ kind: 'ride', ride })),
    ...routes.map((route): BaladeItem => ({ kind: 'route', route })),
  ].sort((a, b) => itemDate(b) - itemDate(a));

  const favoriteItems: readonly BaladeItem[] = routes.map((route) => ({ kind: 'route', route }));

  const items = tab === 'all' ? allItems : tab === 'favorites' ? favoriteItems : [];
  const isLoading = isLoadingRides || isLoadingRoutes;
  const error = ridesError ?? routesError;
  const emptyMessage =
    tab === 'gpxImports'
      ? 'Import GPX pas encore disponible — aucun itinéraire importé.'
      : tab === 'favorites'
        ? 'Aucun itinéraire enregistré pour l’instant.'
        : 'Aucune balade ni itinéraire enregistré pour l’instant.';

  const tabOptions: readonly { value: Tab; label: string }[] = [
    { value: 'all', label: `Toutes (${String(allItems.length)})` },
    { value: 'favorites', label: `Favoris (${String(favoriteItems.length)})` },
    { value: 'gpxImports', label: 'Imports GPX (0)' },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + APP_HEADER_HEIGHT + spacing.sm }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitle}>
            <MaterialCommunityIcons name="motorbike" size={22} color={colors.accent} />
            <Text variant="title">Mes Balades</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Importer un fichier GPX"
            onPress={() => {
              snackbar.show(GPX_UNAVAILABLE_MESSAGE);
            }}
            style={({ pressed }) => [styles.gpxButton, pressed ? styles.pressed : null]}
          >
            <MaterialCommunityIcons name="file-upload-outline" size={16} color={colors.accent} />
            <Text variant="monoBold" color={colors.accent} style={styles.gpxButtonLabel}>
              + GPX
            </Text>
          </Pressable>
        </View>
        <View style={styles.tabs}>
          <SegmentedToggle options={tabOptions} value={tab} onChange={setTab} />
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.centered}>
          <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
            {error ?? (isLoading ? 'Chargement…' : emptyMessage)}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={itemId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => {
                refreshRides();
                refreshRoutes();
              }}
              tintColor={colors.accent}
            />
          }
          ListHeaderComponent={
            tab === 'all' ? (
              <View style={styles.listHeaderSection}>
                <CarnetDeRouteCard rides={rides} />
                {latestRide !== undefined ? (
                  <LastRideHeroCard
                    ride={latestRide}
                    points={latestRidePoints}
                    onRelaunch={handleRelaunchRide}
                    onExportGpx={handleExportLatestGpx}
                    isExportingGpx={isExportingGpx}
                    onToggleFavorite={() => {
                      toggleFavorite(latestRide.id);
                    }}
                  />
                ) : null}
                <View style={styles.sectionHeaderRow}>
                  <Text variant="mono" color={colors.textDense} style={styles.sectionLabel}>
                    RÉCENTES & ENREGISTRÉES
                  </Text>
                  <Text variant="mono" color={colors.textSecondary} style={styles.sectionSort}>
                    TRI : DATE
                  </Text>
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={<OfflineStorageBanner />}
          renderItem={({ item }) => (
            <BaladeCard
              item={item}
              onPress={() => {
                setSelectedItem(item);
              }}
              onLaunch={() => {
                handleLaunch(item);
              }}
            />
          )}
        />
      )}

      {selectedItem !== undefined ? (
        <BaladeDetailModal
          item={selectedItem}
          points={selectedItem.kind === 'ride' ? selectedRidePoints : undefined}
          mapPath={selectedItem.kind === 'ride' ? selectedRidePoints?.map((point) => point.position) : selectedRoutePath}
          onClose={() => {
            setSelectedItem(undefined);
          }}
          onDelete={() => {
            if (selectedItem.kind === 'ride') {
              removeRide(selectedItem.ride.id);
            } else {
              removeRoute(selectedItem.route.id);
            }
          }}
          onLaunch={handleModalLaunch}
          onToggleFavorite={
            selectedItem.kind === 'ride'
              ? () => {
                  toggleFavorite(selectedItem.ride.id);
                }
              : undefined
          }
        />
      ) : null}

      <View style={[styles.snackbarWrapper, { bottom: insets.bottom + spacing.sm }]}>
        <Snackbar message={snackbar.message} />
      </View>
    </View>
  );
}
