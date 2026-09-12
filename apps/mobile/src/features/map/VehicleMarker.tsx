import { Images, Layer, LayerAnnotation } from '@maplibre/maplibre-react-native';
import type React from 'react';

import vehicleIcon from '../../../assets/vehicle-marker.png';
import { useVehiclePosition } from './useVehiclePosition';

// MapLibre v11 n'a plus de marqueur à base de View React Native (ni MarkerView,
// ni PointAnnotation) : un marqueur custom est forcément une image enregistrée
// via <Images> puis dessinée par une couche `symbol`. Bonus : la rotation est
// une propriété de style appliquée côté GPU, sans re-rendu React.
const ICON_ID = 'roadtalk-vehicle-icon';
const SOURCE_ID = 'roadtalk-vehicle-source';

export function VehicleMarker(): React.JSX.Element | null {
  const position = useVehiclePosition();

  if (!position) {
    return null;
  }

  return (
    <>
      <Images images={{ [ICON_ID]: vehicleIcon }} />
      <LayerAnnotation id={SOURCE_ID} lngLat={position.lngLat} animated>
        <Layer
          type="symbol"
          id="roadtalk-vehicle-symbol"
          source={SOURCE_ID}
          layout={{
            'icon-image': ICON_ID,
            // Jamais masqué par la gestion de collision des libellés.
            'icon-allow-overlap': true,
            // "map" : la rotation est un cap absolu par rapport au nord, pas
            // un angle à l'écran — indispensable dès que la carte tournera
            // (futur écran de guidage).
            'icon-rotation-alignment': 'map',
            'icon-pitch-alignment': 'map',
            'icon-rotate': position.headingDeg ?? 0,
          }}
        />
      </LayerAnnotation>
    </>
  );
}
