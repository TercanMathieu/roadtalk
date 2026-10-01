import { Camera, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native';
import type { GeoPoint } from '@roadtalk/domain-shared';
import type React from 'react';
import { View } from 'react-native';

import { colors } from '../../ui';
import { MAP_STYLE_URL } from '../map/map.config';
import { styles } from './RideTrackMap.styles';

const BOUNDS_PADDING_DP = 24;
// Trajet réduit à un point (ou quasiment) : une bbox de taille nulle ferait
// planter l'ajustement de caméra — marge minimale en degrés pour garder une
// vue cohérente plutôt qu'un zoom extrême sur un point.
const MIN_BOUNDS_DEGREES = 0.002;

interface Props {
  // Tracé réellement enregistré pendant le guidage (voir useTrackRecording),
  // jamais une ligne droite ou des données d'exemple.
  readonly path: readonly GeoPoint[];
}

// Aperçu non interactif : montre le tracé réel, départ et arrivée — pas la
// carte de préparation/guidage, qui reste la seule surface pilotable.
export function RideTrackMap({ path }: Props): React.JSX.Element | null {
  const first = path[0];
  const last = path[path.length - 1];
  if (first === undefined || last === undefined) {
    return null;
  }

  // Nombres bruts, pas Degrees : la bbox se recalcule par arithmétique
  // simple (recentrage sur un point unique), pas une coordonnée géo isolée.
  let west: number = first.longitude;
  let east: number = first.longitude;
  let south: number = first.latitude;
  let north: number = first.latitude;
  for (const point of path) {
    if (point.longitude < west) west = point.longitude;
    if (point.longitude > east) east = point.longitude;
    if (point.latitude < south) south = point.latitude;
    if (point.latitude > north) north = point.latitude;
  }
  if (east - west < MIN_BOUNDS_DEGREES) {
    const center = (east + west) / 2;
    west = center - MIN_BOUNDS_DEGREES / 2;
    east = center + MIN_BOUNDS_DEGREES / 2;
  }
  if (north - south < MIN_BOUNDS_DEGREES) {
    const center = (north + south) / 2;
    south = center - MIN_BOUNDS_DEGREES / 2;
    north = center + MIN_BOUNDS_DEGREES / 2;
  }

  const lineGeometry: GeoJSON.LineString = {
    type: 'LineString',
    coordinates: path.map((point) => [point.longitude, point.latitude]),
  };
  const startEndGeometry: GeoJSON.FeatureCollection<GeoJSON.Point> = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { isStart: true }, geometry: { type: 'Point', coordinates: [first.longitude, first.latitude] } },
      { type: 'Feature', properties: { isStart: false }, geometry: { type: 'Point', coordinates: [last.longitude, last.latitude] } },
    ],
  };

  return (
    <View style={styles.container}>
      <Map
        style={styles.map}
        mapStyle={MAP_STYLE_URL}
        dragPan={false}
        touchZoom={false}
        doubleTapZoom={false}
        doubleTapHoldZoom={false}
        touchRotate={false}
        touchPitch={false}
      >
        <Camera
          initialViewState={{
            bounds: [west, south, east, north],
            padding: {
              top: BOUNDS_PADDING_DP,
              right: BOUNDS_PADDING_DP,
              bottom: BOUNDS_PADDING_DP,
              left: BOUNDS_PADDING_DP,
            },
          }}
        />
        <GeoJSONSource id="roadtalk-ride-track-source" data={lineGeometry}>
          <Layer
            type="line"
            id="roadtalk-ride-track-line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': colors.accent, 'line-width': 4 }}
          />
        </GeoJSONSource>
        <GeoJSONSource id="roadtalk-ride-endpoints-source" data={startEndGeometry}>
          <Layer
            type="circle"
            id="roadtalk-ride-endpoints-circle"
            paint={{
              'circle-radius': 6,
              'circle-color': ['case', ['get', 'isStart'], colors.textPrimary, colors.accent],
              'circle-stroke-width': 2,
              'circle-stroke-color': colors.background,
            }}
          />
        </GeoJSONSource>
      </Map>
    </View>
  );
}
