import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import type React from 'react';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, SegmentedToggle, Snackbar, spacing, Text, useSnackbar } from '../../ui';
import { APP_HEADER_HEIGHT } from '../map/AppHeader.styles';
import { usePendingRouteLaunchStore } from '../saved-routes/pendingRouteLaunch.store';
import { savedRouteOrigin, saveRoutesWaypointsToStops } from '../saved-routes/toStops';
import { useSavedRoutes } from '../saved-routes/useSavedRoutes';
import { BaladeCard } from './BaladeCard';
import { BaladeDetailModal } from './BaladeDetailModal';
import { type BaladeItem, itemDate, itemId, itemIsFavorite } from './baladeItem';
import { BaladeRow } from './BaladeRow';
import { CarnetDeRouteCard } from './CarnetDeRouteCard';
import { styles } from './HistoryScreen.styles';
import { type BaladeGeometry, loadBaladeGeometry } from './useBaladeGeometry';
import { useRideHistory } from './useRideHistory';

const GPX_UNAVAILABLE_MESSAGE = 'Import GPX bientôt disponible.';
const GPX_EXPORT_FAILED_MESSAGE = "L'export GPX a échoué.";
const LAUNCH_FAILED_MESSAGE = 'Impossible de charger le tracé de cette balade.';

type Tab = 'history' | 'saved' | 'favorites' | 'friends';

const TAB_OPTIONS: readonly { value: Tab; label: string }[] = [
  { value: 'history', label: 'Historique' },
  { value: 'saved', label: 'Enregistrées' },
  { value: 'favorites', label: 'Favoris' },
  { value: 'friends', label: 'Amis' },
];

const EMPTY_MESSAGES: Record<Tab, string> = {
  history: 'Aucune balade pour l’instant. Lance un guidage : ta balade s’enregistre ici.',
  saved: 'Aucun itinéraire enregistré. Prépare-en un sur la carte ou avec l’IA, puis enregistre-le.',
  favorites: 'Aucun favori pour l’instant. Touche l’étoile d’une balade pour la retrouver ici.',
  // Le système d'amis n'existe pas encore (V2) : onglet honnêtement vide.
  friends: 'Bientôt : les balades que tes amis t’enverront arriveront ici.',
};

// Quatre onglets : l'historique des balades roulées, les itinéraires
// enregistrés (préparés sur la carte ou générés par l'IA), les favoris des
// deux, et les balades reçues d'amis — vide tant que les amis n'existent pas.
export function HistoryScreen(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('history');
  // Identifiant plutôt que l'objet : le détail relit ainsi la version à jour
  // de la liste (nom, favori) au lieu d'une copie figée à l'ouverture.
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const snackbar = useSnackbar();
  const {
    rides,
    isLoading: isLoadingRides,
    error: ridesError,
    refresh: refreshRides,
    removeRide,
    toggleFavorite: toggleRideFavorite,
    renameRide,
  } = useRideHistory();
  const {
    routes,
    isLoading: isLoadingRoutes,
    error: routesError,
    refresh: refreshRoutes,
    removeRoute,
    renameRoute,
    toggleFavorite: toggleRouteFavorite,
  } = useSavedRoutes();
  // Indicateur réservé au geste « tirer pour rafraîchir » : le rechargement
  // à chaque affichage de l'onglet se fait sans spinner.
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);

  // À chaque affichage, pas seulement au premier : l'onglet reste monté, et
  // ce qui est enregistré ailleurs (carte, itinéraire IA, fin de guidage)
  // n'apparaissait qu'après un rafraîchissement manuel.
  useFocusEffect(
    useCallback(() => {
      setIsPullRefreshing(false);
      refreshRides();
      refreshRoutes();
    }, [refreshRides, refreshRoutes]),
  );

  const latestRide = rides[0];

  // Les deux listes arrivent de l'API déjà triées, la plus récente d'abord.
  const rideItems = rides.map((ride): BaladeItem => ({ kind: 'ride', ride }));
  const routeItems = routes.map((route): BaladeItem => ({ kind: 'route', route }));
  const allItems = [...rideItems, ...routeItems];
  const favoriteItems = allItems
    .filter(itemIsFavorite)
    .sort((a, b) => itemDate(b) - itemDate(a));
  const selectedItem = allItems.find((item) => itemId(item) === selectedId);

  // Relancer un itinéraire reprend ses arrêts ; relancer une balade vise son
  // point d'arrivée (dernier point du tracé), faute d'arrêts enregistrés.
  const handleLaunch = (item: BaladeItem, geometry: BaladeGeometry | undefined): void => {
    if (item.kind === 'route') {
      const origin = item.route.fixedStart ? savedRouteOrigin(item.route.waypoints) : undefined;
      usePendingRouteLaunchStore.getState().setPending({
        stops: saveRoutesWaypointsToStops(item.route.waypoints),
        avoidHighways: item.route.routingOptions.avoidHighways,
        ...(origin !== undefined ? { origin } : {}),
      });
      router.push('/');
      return;
    }

    const lastPoint = geometry?.path[geometry.path.length - 1];
    if (lastPoint === undefined) {
      return;
    }
    usePendingRouteLaunchStore.getState().setPending({
      stops: [
        {
          label: `${lastPoint.latitude.toFixed(4)}, ${lastPoint.longitude.toFixed(4)}`,
          context: null,
          latitude: lastPoint.latitude,
          longitude: lastPoint.longitude,
        },
      ],
      avoidHighways: false,
    });
    router.push('/');
  };

  // Une ligne n'affiche pas de carte, donc n'a pas encore son tracé : pour
  // une balade, il est chargé au moment de la relancer (un itinéraire n'en a
  // pas besoin, ses arrêts suffisent).
  const handleRowLaunch = (item: BaladeItem): void => {
    if (item.kind === 'route') {
      handleLaunch(item, undefined);
      return;
    }
    loadBaladeGeometry(item)
      .then((geometry) => {
        handleLaunch(item, geometry);
      })
      .catch(() => {
        snackbar.show(LAUNCH_FAILED_MESSAGE);
      });
  };

  const handleToggleFavorite = (item: BaladeItem): void => {
    if (item.kind === 'ride') {
      toggleRideFavorite(item.ride.id);
    } else {
      toggleRouteFavorite(item.route.id);
    }
  };

  // Historique : la dernière balade a sa carte en tête de liste, les lignes
  // reprennent à partir de la précédente.
  const items: readonly BaladeItem[] =
    tab === 'history'
      ? rideItems.slice(1)
      : tab === 'saved'
        ? routeItems
        : tab === 'favorites'
          ? favoriteItems
          : [];
  const isEmpty = tab === 'history' ? latestRide === undefined : items.length === 0;
  const isLoading =
    tab === 'history'
      ? isLoadingRides
      : tab === 'saved'
        ? isLoadingRoutes
        : isLoadingRides || isLoadingRoutes;
  const error =
    tab === 'history' ? ridesError : tab === 'saved' ? routesError : (ridesError ?? routesError);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + APP_HEADER_HEIGHT + spacing.sm }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitle}>
            <Text variant="title">Balades</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Importer un fichier GPX"
            onPress={() => {
              snackbar.show(GPX_UNAVAILABLE_MESSAGE);
            }}
            style={({ pressed }) => [styles.gpxButton, pressed ? styles.pressed : null]}
          >
            <MaterialCommunityIcons name="file-upload-outline" size={16} color={colors.textPrimary} />
            <Text variant="captionStrong" color={colors.textPrimary}>
              Importer
            </Text>
          </Pressable>
        </View>
        <View style={styles.tabs}>
          <SegmentedToggle options={TAB_OPTIONS} value={tab} onChange={setTab} />
        </View>
      </View>

      {isEmpty ? (
        <View style={styles.centered}>
          <Text variant="body" color={colors.textSecondary} style={styles.subtitle}>
            {tab === 'friends'
              ? EMPTY_MESSAGES.friends
              : (error ?? (isLoading ? 'Chargement…' : EMPTY_MESSAGES[tab]))}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={itemId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isPullRefreshing && isLoading}
              onRefresh={() => {
                setIsPullRefreshing(true);
                refreshRides();
                refreshRoutes();
              }}
              tintColor={colors.accent}
            />
          }
          ListHeaderComponent={
            tab === 'history' ? (
              <View style={styles.listHeaderSection}>
                <CarnetDeRouteCard rides={rides} />
                {latestRide !== undefined ? (
                  <BaladeCard
                    item={{ kind: 'ride', ride: latestRide }}
                    onOpenDetail={() => {
                      setSelectedId(latestRide.id);
                    }}
                    onLaunch={(geometry) => {
                      handleLaunch({ kind: 'ride', ride: latestRide }, geometry);
                    }}
                    onToggleFavorite={() => {
                      toggleRideFavorite(latestRide.id);
                    }}
                    onExportFailed={() => {
                      snackbar.show(GPX_EXPORT_FAILED_MESSAGE);
                    }}
                  />
                ) : null}
                {items.length > 0 ? (
                  <Text variant="label" color={colors.textSecondary} style={styles.sectionLabel}>
                    Précédentes
                  </Text>
                ) : null}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <BaladeRow
              item={item}
              onPress={() => {
                setSelectedId(itemId(item));
              }}
              onLaunch={() => {
                handleRowLaunch(item);
              }}
            />
          )}
        />
      )}

      {selectedItem !== undefined ? (
        <BaladeDetailModal
          item={selectedItem}
          onClose={() => {
            setSelectedId(undefined);
          }}
          onDelete={() => {
            if (selectedItem.kind === 'ride') {
              removeRide(selectedItem.ride.id);
            } else {
              removeRoute(selectedItem.route.id);
            }
          }}
          onLaunch={(geometry) => {
            handleLaunch(selectedItem, geometry);
            setSelectedId(undefined);
          }}
          onRename={(name) => {
            if (selectedItem.kind === 'ride') {
              renameRide(selectedItem.ride.id, name);
            } else {
              renameRoute(selectedItem.route.id, name);
            }
          }}
          onToggleFavorite={() => {
            handleToggleFavorite(selectedItem);
          }}
        />
      ) : null}

      <View style={[styles.snackbarWrapper, { bottom: insets.bottom + spacing.sm }]}>
        <Snackbar message={snackbar.message} />
      </View>
    </View>
  );
}
