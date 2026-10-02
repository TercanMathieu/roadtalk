import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import type { GeoPointDto } from '@roadtalk/contracts';
import type React from 'react';

import { colors } from '../../ui';

const SOURCE_ID = 'roadtalk-next-maneuver-source';

interface Props {
  readonly point: GeoPointDto;
}

// Repère sur la carte de l'endroit exact de la prochaine manœuvre : relie la
// consigne du bandeau ("dans 200 m, à droite") à un point visible sur le
// tracé, sans avoir à compter les intersections.
export function ManeuverMarker({ point }: Props): React.JSX.Element {
  const geometry: GeoJSON.Point = { type: 'Point', coordinates: [point.longitude, point.latitude] };

  return (
    <GeoJSONSource id={SOURCE_ID} data={geometry}>
      <Layer
        type="circle"
        id="roadtalk-next-maneuver-circle"
        paint={{
          'circle-radius': 9,
          'circle-color': colors.textPrimary,
          'circle-stroke-width': 4,
          'circle-stroke-color': colors.accent,
        }}
      />
    </GeoJSONSource>
  );
}
