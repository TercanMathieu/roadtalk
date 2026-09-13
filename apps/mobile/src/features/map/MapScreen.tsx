import {
  Camera,
  type CameraRef,
  LogManager,
  Map,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native';
import type { AddressSuggestionDto } from '@roadtalk/contracts';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { useLastKnownPosition } from '../../lib/useLastKnownPosition';
import { colors, Text } from '../../ui';
import { AddressSearchBar } from '../search/AddressSearchBar';
import { DestinationMarker } from './DestinationMarker';
import { loadNavigationMapStyle } from './loadMapStyle';
import { DEFAULT_CENTER_COORDINATES, DEFAULT_ZOOM_LEVEL, MAP_STYLE_URL } from './map.config';
import { styles } from './MapScreen.styles';
import { useUserLocationPermission } from './useUserLocationPermission';
import { VehicleMarker } from './VehicleMarker';

const FLY_TO_DURATION_MS = 1200;

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
  const cameraRef = useRef<CameraRef>(null);
  const permission = useUserLocationPermission();
  // Tenu ici plutôt que dans la barre de recherche : l'identité de la ref est
  // stable, la passer en prop ne provoque aucun rendu supplémentaire.
  const originRef = useLastKnownPosition(permission === 'granted');

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
    // Déplacement impératif plutôt qu'une prop contrôlée : la caméra ne doit
    // bouger qu'à la sélection, sinon chaque rendu ramènerait la vue de force
    // et empêcherait de se déplacer à la main.
    cameraRef.current?.flyTo({
      center: [suggestion.longitude, suggestion.latitude],
      zoom: DEFAULT_ZOOM_LEVEL,
      duration: FLY_TO_DURATION_MS,
    });
  };

  // Le suivi automatique de la position est relâché dès qu'une destination est
  // choisie : sinon la caméra ramènerait aussitôt la vue sur l'utilisateur.
  const followsUser = permission === 'granted' && destination === undefined;

  return (
    <View style={styles.container}>
      <Map style={styles.map} mapStyle={mapStyle}>
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: DEFAULT_CENTER_COORDINATES,
            zoom: DEFAULT_ZOOM_LEVEL,
          }}
          {...(followsUser ? { trackUserLocation: 'default' as const } : {})}
        />
        {permission === 'granted' ? <VehicleMarker /> : null}
        {destination !== undefined ? (
          <DestinationMarker lngLat={[destination.longitude, destination.latitude]} />
        ) : null}
      </Map>

      <AddressSearchBar onSelect={handleSelectDestination} originRef={originRef} />

      {permission === 'denied' ? (
        <View style={styles.permissionBanner}>
          <Text variant="body" color={colors.textPrimary}>
            Active la localisation dans les réglages du téléphone pour te situer sur la carte.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
