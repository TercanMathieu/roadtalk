import { Images, Layer, LayerAnnotation } from '@maplibre/maplibre-react-native';
import type React from 'react';

import destinationIcon from '../../../assets/destination-marker.png';

const ICON_ID = 'roadtalk-destination-icon';
const SOURCE_ID = 'roadtalk-destination-source';

interface Props {
  // [longitude, latitude] — convention GeoJSON/MapLibre.
  readonly lngLat: [number, number];
}

export function DestinationMarker({ lngLat }: Props): React.JSX.Element {
  return (
    <>
      <Images images={{ [ICON_ID]: destinationIcon }} />
      <LayerAnnotation id={SOURCE_ID} lngLat={lngLat}>
        <Layer
          type="symbol"
          id="roadtalk-destination-symbol"
          source={SOURCE_ID}
          layout={{
            'icon-image': ICON_ID,
            'icon-allow-overlap': true,
            // La pointe de la goutte marque le lieu, pas le centre de l'image.
            'icon-anchor': 'bottom',
          }}
        />
      </LayerAnnotation>
    </>
  );
}
