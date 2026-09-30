import {
  Camera,
  type CameraRef,
  LogManager,
  Map,
  type StyleSpecification,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import type { AddressSuggestionDto } from '@roadtalk/contracts';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { View } from 'react-native';

import { useLastKnownPosition } from '../../lib/useLastKnownPosition';
import { colors, Text } from '../../ui';
import { useRoute } from '../routing/useRoute';
import { AddressSearchBar } from '../search/AddressSearchBar';
import { DestinationMarker } from './DestinationMarker';
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
import { useUserLocationPermission } from './useUserLocationPermission';
import { VehicleMarker } from './VehicleMarker';

const FLY_TO_DURATION_MS = 1200;

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
  const [destination, setDestination] = useState<AddressSuggestionDto | undefined>(undefined);
  const [isFollowing, setIsFollowing] = useState(true);
  const cameraRef = useRef<CameraRef>(null);
  const permission = useUserLocationPermission();
  // Tenu ici plutôt que dans la barre de recherche : l'identité de la ref est
  // stable, la passer en prop ne provoque aucun rendu supplémentaire.
  const originRef = useLastKnownPosition(permission === 'granted');
  const { route, error: routeError } = useRoute(destination, originRef);

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
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectDestination = (suggestion: AddressSuggestionDto): void => {
    setDestination(suggestion);
    // Relâche le suivi : sinon la caméra ramènerait aussitôt la vue sur
    // l'utilisateur, rendant la destination impossible à regarder.
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

  return (
    <View style={styles.container}>
      <Map
        style={styles.map}
        mapStyle={mapStyle}
        onRegionWillChange={handleMapMoveStart}
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
        {permission === 'granted' ? <VehicleMarker /> : null}
        {/* Avant le marqueur de destination : ordre = ordre de dessin, la
            ligne doit passer sous l'épingle, pas au-dessus. */}
        {route !== undefined ? <RouteLine path={route.path} /> : null}
        {destination !== undefined ? (
          <DestinationMarker lngLat={[destination.longitude, destination.latitude]} />
        ) : null}
      </Map>

      <AddressSearchBar onSelect={handleSelectDestination} originRef={originRef} />

      {permission === 'granted' ? (
        <RecenterButton isFollowing={isFollowing} onPress={handleRecenter} />
      ) : null}

      {permission === 'denied' ? (
        <View style={styles.permissionBanner}>
          <Text variant="body" color={colors.textPrimary}>
            Active la localisation dans les réglages du téléphone pour te situer sur la carte.
          </Text>
        </View>
      ) : null}

      {routeError !== undefined ? (
        <View style={styles.routeErrorBanner}>
          <Text variant="body" color={colors.textPrimary}>
            {routeError}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
