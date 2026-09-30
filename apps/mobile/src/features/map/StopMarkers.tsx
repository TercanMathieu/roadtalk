import { GeoJSONSource, Images, Layer } from '@maplibre/maplibre-react-native';
import type { GeoPointDto } from '@roadtalk/contracts';
import type React from 'react';

import destinationIcon from '../../../assets/destination-marker.png';

const ICON_ID = 'roadtalk-destination-icon';
const SOURCE_ID = 'roadtalk-destination-source';

interface Props {
  // Un ou plusieurs arrêts, dans l'ordre de visite — toujours au moins un
  // point si le composant est rendu (l'appelant ne le monte pas sinon).
  // Tous partagent la même icône pour l'instant : les distinguer visuellement
  // (numéros, icône différente pour l'arrivée) est laissé pour plus tard.
  readonly points: readonly GeoPointDto[];
}

export function StopMarkers({ points }: Props): React.JSX.Element {
  const geometry: GeoJSON.FeatureCollection<GeoJSON.Point> = {
    type: 'FeatureCollection',
    features: points.map((point) => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [point.longitude, point.latitude] },
    })),
  };

  return (
    <>
      <Images images={{ [ICON_ID]: destinationIcon }} />
      <GeoJSONSource id={SOURCE_ID} data={geometry}>
        <Layer
          type="symbol"
          id="roadtalk-destination-symbol"
          layout={{
            'icon-image': ICON_ID,
            'icon-allow-overlap': true,
            // La pointe de la goutte marque le lieu, pas le centre de l'image.
            'icon-anchor': 'bottom',
          }}
        />
      </GeoJSONSource>
    </>
  );
}
