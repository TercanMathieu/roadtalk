import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import type { GeoPointDto } from '@roadtalk/contracts';
import type React from 'react';

import { colors } from '../../ui';

const SOURCE_ID = 'roadtalk-route-source';

// Épaisseur généreuse : lisible d'un coup d'œil en roulant (C2), pas un trait
// fin pensé pour un écran de bureau consulté de près.
const LINE_WIDTH = 5;

interface Props {
  // Séquence ordonnée [longitude, latitude] suivant les routes réelles —
  // produite par decodePolyline6 côté API, pas une ligne droite.
  readonly path: readonly GeoPointDto[];
}

export function RouteLine({ path }: Props): React.JSX.Element {
  const geometry: GeoJSON.LineString = {
    type: 'LineString',
    coordinates: path.map((point) => [point.longitude, point.latitude]),
  };

  return (
    <GeoJSONSource id={SOURCE_ID} data={geometry}>
      <Layer
        type="line"
        id="roadtalk-route-line"
        layout={{
          'line-cap': 'round',
          'line-join': 'round',
        }}
        paint={{
          'line-color': colors.accent,
          'line-width': LINE_WIDTH,
        }}
      />
    </GeoJSONSource>
  );
}
