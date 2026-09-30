import {
  Camera,
  type CameraRef,
  LogManager,
  Map,
  type PressEvent,
  type StyleSpecification,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import type { AddressSuggestionDto } from '@roadtalk/contracts';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, NativeSyntheticEvent } from 'react-native';
import { View } from 'react-native';

import { useLastKnownPosition } from '../../lib/useLastKnownPosition';
import { colors, spacing, Text } from '../../ui';
import { withFreshAccessToken } from '../auth/auth.store';
import { useRoute } from '../routing/useRoute';
import { AddressSearchBar } from '../search/AddressSearchBar';
import { reverseGeocode } from '../search/api';
import { loadNavigationMapStyle } from './loadMapStyle';
import {
  DEFAULT_CENTER_COORDINATES,
  DEFAULT_PITCH_DEGREES,
  DEFAULT_ZOOM_LEVEL,
  MAP_STYLE_URL,
} from './map.config';
import { styles } from './MapScreen.styles';
import { RecenterButton } from './RecenterButton';
import { RouteLine } from './RouteLine';
import { StopMarkers } from './StopMarkers';
import { TripSummaryCard } from './TripSummaryCard';
import { useUserLocationPermission } from './useUserLocationPermission';
import { VehicleMarker } from './VehicleMarker';

const FLY_TO_DURATION_MS = 1200;

// Même arrondi que le libellé de repli du backend (search.service.ts) : un
// arrêt ajouté par appui long s'affiche avec ce libellé immédiatement, avant
// même de savoir si le géocodage inverse trouvera un nom de lieu.
const PLACEHOLDER_LABEL_DECIMALS = 4;

// Hissé hors du composant : une identité stable évite de re-notifier la vue
// native à chaque rendu pour une valeur qui, elle, ne change jamais.
const INITIAL_VIEW_STATE = {
  center: DEFAULT_CENTER_COORDINATES,
  zoom: DEFAULT_ZOOM_LEVEL,
  pitch: DEFAULT_PITCH_DEGREES,
} as const;

// MapLibre est bavard au niveau "warn" (avertissements de style à chaque
// chargement) et chacun de ces messages transite par `console.warn`, donc par
// le pont de logs d'Expo — dont la construction de pile plante sur cette
// version. Filtrer au niveau natif tarit la source sans masquer les vraies
// erreurs, qui continuent de remonter.
LogManager.setLogLevel('error');

// Écran de préparation (DA section 8) : vue d'ensemble de la position, pas le
// guidage minimal — le recentrage "default" ne fait pas tourner la carte
// selon le cap, contrairement au futur écran de guidage turn-by-turn.
export function MapScreen(): React.JSX.Element {
  const [mapStyle, setMapStyle] = useState<string | StyleSpecification>(MAP_STYLE_URL);
  // Vrai une fois que `mapStyle` a atteint sa valeur finale (succès ou échec
  // du chargement filtré) — jamais avant. Un remplacement de style en cours
  // de vie du composant recharge le style natif en entier
  // (MLRNMapView.setReactMapStyle : removeAllSourcesFromMap puis
  // addAllSourcesToMap) ; une image enregistrée via <Images> avant ce
  // remplacement (VehicleMarker) n'est pas garantie de survivre au
  // rechargement. Retarder le montage des calques custom jusqu'à ce que le
  // style ne bouge plus plutôt que de compter sur une éventuelle
  // récupération native après coup.
  const [isStyleReady, setIsStyleReady] = useState(false);
  // Dans l'ordre de visite. La position de l'utilisateur (originRef) sert
  // toujours de premier point du trajet — elle ne fait jamais partie de cette
  // liste, qui ne contient que les arrêts choisis.
  const [stops, setStops] = useState<readonly AddressSuggestionDto[]>([]);
  const [isFollowing, setIsFollowing] = useState(true);
  // Hauteur réelle de TripSummaryCard, mesurée au rendu : sa taille varie
  // selon le nombre d'arrêts et son contenu (chargement, erreur, ou les
  // trois statistiques), donc une valeur fixe aurait soit laissé un vide,
  // soit chevauché le bouton.
  const [tripSummaryCardHeight, setTripSummaryCardHeight] = useState(0);
  const cameraRef = useRef<CameraRef>(null);
  const permission = useUserLocationPermission();
  // Tenu ici plutôt que dans la barre de recherche : l'identité de la ref est
  // stable, la passer en prop ne provoque aucun rendu supplémentaire.
  const { positionRef: originRef, hasFix: hasGpsFix } = useLastKnownPosition(permission === 'granted');
  const { route, isComputing: isComputingRoute, error: routeError } = useRoute(stops, originRef, hasGpsFix);

  useEffect(() => {
    let cancelled = false;

    loadNavigationMapStyle()
      .then((filtered) => {
        if (!cancelled) {
          setMapStyle(filtered);
        }
      })
      .catch(() => {
        // Le style brut (MAP_STYLE_URL) reste affiché en repli — carte
        // fonctionnelle mais avec les POI, plutôt qu'un écran vide.
      })
      .finally(() => {
        // Succès ou échec : `mapStyle` ne changera plus après ça.
        if (!cancelled) {
          setIsStyleReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Ajoute toujours un arrêt plutôt que de remplacer la destination
  // existante : un premier choix devient ainsi naturellement le premier
  // arrêt, sans cas particulier à gérer pour distinguer "première sélection"
  // et "arrêt supplémentaire".
  const handleAddStop = (suggestion: AddressSuggestionDto): void => {
    const lastStop = stops[stops.length - 1];
    // Même adresse que le dernier arrêt = segment de longueur nulle, sans
    // intérêt pour un trajet (vérifié auprès de Valhalla : il l'accepte sans
    // erreur, mais produit une étape à 0 km). Comparé sur les coordonnées,
    // pas le libellé — deux résultats de recherche au même endroit mais
    // formulés différemment désignent quand même le même point. Un
    // aller-retour (A → B → A) reste autorisé : seul le doublon consécutif
    // est bloqué.
    if (lastStop?.latitude === suggestion.latitude && lastStop.longitude === suggestion.longitude) {
      return;
    }

    setStops((previous) => [...previous, suggestion]);
    // Relâche le suivi : sinon la caméra ramènerait aussitôt la vue sur
    // l'utilisateur, rendant l'arrêt impossible à regarder.
    setIsFollowing(false);
    // Déplacement impératif plutôt qu'une prop contrôlée : la caméra ne doit
    // bouger qu'à la sélection, sinon chaque rendu ramènerait la vue de force
    // et empêcherait de se déplacer à la main.
    cameraRef.current?.flyTo({
      center: [suggestion.longitude, suggestion.latitude],
      zoom: DEFAULT_ZOOM_LEVEL,
      duration: FLY_TO_DURATION_MS,
    });
  };

  const handleRemoveStop = (index: number): void => {
    setStops((previous) => previous.filter((_stop, i) => i !== index));
  };

  // Appui long plutôt qu'un simple tap : un tap seul reste disponible pour
  // interagir avec la carte (sélectionner un marqueur, etc.) sans risquer
  // d'ajouter un arrêt par mégarde en regardant simplement la carte. Un
  // double-tap avait été tenté d'abord, mais MapLibre reconnaît le geste en
  // interne pour son propre zoom au double-tap avant que `onPress` ne soit
  // jamais appelé — même moteur désactivé, le geste ne remonte pas. L'appui
  // long est un geste natif dédié, sans ce conflit.
  //
  // L'arrêt est ajouté tout de suite avec un libellé de repli (coordonnées) :
  // le point et le récapitulatif apparaissent sans attendre le géocodage
  // inverse, qui n'enrichit ensuite que le libellé affiché — jamais
  // nécessaire au calcul de l'itinéraire, qui n'utilise que les coordonnées
  // (voir useRoute, qui ne relance pas le calcul pour cette mise à jour).
  const handleMapLongPress = (event: NativeSyntheticEvent<PressEvent>): void => {
    const [longitude, latitude] = event.nativeEvent.lngLat;

    handleAddStop({
      label: `${latitude.toFixed(PLACEHOLDER_LABEL_DECIMALS)}, ${longitude.toFixed(PLACEHOLDER_LABEL_DECIMALS)}`,
      context: null,
      latitude,
      longitude,
    });

    withFreshAccessToken((accessToken) => reverseGeocode(accessToken, { latitude, longitude }))
      .then((suggestion) => {
        // Retrouvé par les coordonnées exactes de l'appui (pas celles de
        // `suggestion`, potentiellement celles d'un lieu voisin si Photon a
        // trouvé une correspondance) : c'est cet arrêt-là qu'on enrichit.
        setStops((previous) =>
          previous.map((stop) =>
            stop.latitude === latitude && stop.longitude === longitude ? suggestion : stop,
          ),
        );
      })
      .catch(() => {
        // Le libellé de repli reste affiché — même convention que le repli
        // déjà appliqué côté backend quand Photon ne trouve rien : un échec
        // du géocodage inverse n'empêche pas l'arrêt d'exister.
      });
  };

  const handleTripSummaryCardLayout = (event: LayoutChangeEvent): void => {
    setTripSummaryCardHeight(event.nativeEvent.layout.height);
  };

  const handleRecenter = (): void => {
    setIsFollowing(true);

    // Le suivi seul recentrerait déjà, mais seulement au prochain point GPS.
    // Ce déplacement immédiat rend l'appui perceptible tout de suite, et
    // restaure zoom et inclinaison que l'utilisateur a pu modifier à la main.
    const origin = originRef.current;
    if (origin !== undefined) {
      cameraRef.current?.flyTo({
        center: [origin.longitude, origin.latitude],
        zoom: DEFAULT_ZOOM_LEVEL,
        pitch: DEFAULT_PITCH_DEGREES,
        duration: FLY_TO_DURATION_MS,
      });
    }
  };

  // L'utilisateur reprend la main sur la caméra : on lâche le suivi, sinon le
  // prochain point GPS ramènerait la vue et rendrait la carte impossible à
  // explorer.
  //
  // Les deux champs sont nécessaires. `userInteraction` seul ne suffit pas :
  // côté natif il vaut aussi vrai pour une animation déclenchée par le code
  // (CameraChangeTracker.isUserInteraction accepte DEVELOPER_ANIMATION), donc
  // nos propres `flyTo` — dont celui du bouton de recentrage — l'allumeraient
  // et éteindraient le suivi juste après l'avoir armé. `animated` distingue les
  // deux : faux pour un vrai geste, vrai pour une animation programmée.
  const handleMapMoveStart = (event: NativeSyntheticEvent<ViewStateChangeEvent>): void => {
    if (event.nativeEvent.userInteraction && !event.nativeEvent.animated) {
      setIsFollowing(false);
    }
  };

  const followsUser = permission === 'granted' && isFollowing;
  const showsTripSummary = stops.length > 0 && permission === 'granted';
  // spacing.lg : la marge basse de TripSummaryCard elle-même (voir son style)
  // — le bouton doit franchir toute la hauteur de la carte pour arriver à son
  // sommet, plus un espace pour ne pas coller aux deux.
  const recenterButtonBottom = showsTripSummary
    ? spacing.lg + tripSummaryCardHeight + spacing.sm
    : undefined;

  return (
    <View style={styles.container}>
      <Map
        style={styles.map}
        mapStyle={mapStyle}
        onRegionWillChange={handleMapMoveStart}
        onLongPress={handleMapLongPress}
        // Carte verrouillée au nord. Une carte tournée de travers oblige à se
        // réorienter mentalement avant de lire quoi que ce soit — l'inverse de
        // ce qu'on veut d'un coup d'œil en roulant (C2). Le suivi de position
        // ne rétablit jamais de rotation de son côté : en mode "default" il
        // reprend le cap courant sans le modifier, seuls "heading" et "course"
        // font pivoter la carte. Ce sera le choix de l'écran de guidage, qui
        // est un mode distinct (DA section 8).
        touchRotate={false}
      >
        <Camera
          ref={cameraRef}
          initialViewState={INITIAL_VIEW_STATE}
          // Aussi en prop déclarative, pas seulement dans l'état initial : le
          // suivi de position reconstruit la caméra à chaque point GPS et y
          // remet une inclinaison nulle si elle ne vient pas d'ici
          // (MLRNCamera.kt — `tilt(stop?.pitch ?: 0.0)`).
          pitch={DEFAULT_PITCH_DEGREES}
          {...(followsUser ? { trackUserLocation: 'default' as const } : {})}
        />
        {permission === 'granted' && isStyleReady ? <VehicleMarker /> : null}
        {/* Avant les marqueurs d'arrêt : ordre = ordre de dessin, la ligne
            doit passer sous les épingles, pas au-dessus. */}
        {route !== undefined ? <RouteLine path={route.path} /> : null}
        {stops.length > 0 ? (
          <StopMarkers points={stops.map((stop) => ({ latitude: stop.latitude, longitude: stop.longitude }))} />
        ) : null}
      </Map>

      <AddressSearchBar onSelect={handleAddStop} originRef={originRef} />

      {permission === 'granted' ? (
        <RecenterButton
          isFollowing={isFollowing}
          onPress={handleRecenter}
          {...(recenterButtonBottom !== undefined ? { bottom: recenterButtonBottom } : {})}
        />
      ) : null}

      {permission === 'denied' ? (
        <View style={styles.permissionBanner}>
          <Text variant="body" color={colors.textPrimary}>
            Active la localisation dans les réglages du téléphone pour te situer sur la carte.
          </Text>
        </View>
      ) : null}

      {/* Pas de position, pas d'itinéraire à récapituler : la bannière de
          permission ci-dessus explique déjà la situation, inutile d'ajouter
          une carte bloquée sur "Calcul…" qui ne se résoudra jamais. */}
      {showsTripSummary ? (
        <TripSummaryCard
          stops={stops}
          route={route}
          isComputing={isComputingRoute}
          error={routeError}
          onRemoveStop={handleRemoveStop}
          onLayout={handleTripSummaryCardLayout}
        />
      ) : null}
    </View>
  );
}
