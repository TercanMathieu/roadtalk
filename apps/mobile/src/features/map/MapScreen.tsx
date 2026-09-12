import { Camera, Map, type StyleSpecification } from '@maplibre/maplibre-react-native';
import type React from 'react';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { colors, Text } from '../../ui';
import { loadNavigationMapStyle } from './loadMapStyle';
import { DEFAULT_CENTER_COORDINATES, DEFAULT_ZOOM_LEVEL, MAP_STYLE_URL } from './map.config';
import { styles } from './MapScreen.styles';
import { useUserLocationPermission } from './useUserLocationPermission';
import { VehicleMarker } from './VehicleMarker';

// Écran de préparation (DA section 8) : vue d'ensemble de la position, pas le
// guidage minimal — le recentrage "default" ne fait pas tourner la carte
// selon le cap, contrairement au futur écran de guidage turn-by-turn.
export function MapScreen(): React.JSX.Element {
  const [mapStyle, setMapStyle] = useState<string | StyleSpecification>(MAP_STYLE_URL);
  const permission = useUserLocationPermission();

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

  return (
    <View style={styles.container}>
      <Map style={styles.map} mapStyle={mapStyle}>
        <Camera
          initialViewState={{
            center: DEFAULT_CENTER_COORDINATES,
            zoom: DEFAULT_ZOOM_LEVEL,
          }}
          {...(permission === 'granted' ? { trackUserLocation: 'default' as const } : {})}
        />
        {permission === 'granted' ? <VehicleMarker /> : null}
      </Map>
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
