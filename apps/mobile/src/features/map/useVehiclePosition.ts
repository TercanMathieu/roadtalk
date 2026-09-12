import { useCurrentPosition } from '@maplibre/maplibre-react-native';
import { type Degrees, degrees, metersPerSecond } from '@roadtalk/domain-shared';
import { useEffect, useState } from 'react';

// Règle physique du projet : le cap (course) n'est fiable qu'au-dessus
// d'environ 5 km/h — en dessous, le figer plutôt que le laisser tourner
// aléatoirement à l'arrêt (bruit GPS sur `heading`).
const MIN_SPEED_FOR_HEADING_MPS = metersPerSecond(1.39);

interface VehiclePosition {
  // [longitude, latitude] — convention GeoJSON/MapLibre.
  readonly lngLat: [number, number];
  // undefined tant qu'aucun cap fiable n'a encore été observé.
  readonly headingDeg: Degrees | undefined;
}

// Réutilise le moteur de localisation natif de MapLibre (même flux que
// <Camera trackUserLocation>) plutôt que d'ouvrir une seconde souscription
// GPS — un seul capteur actif (C1).
export function useVehiclePosition(): VehiclePosition | undefined {
  const currentPosition = useCurrentPosition({ minDisplacement: 5 });
  const [headingDeg, setHeadingDeg] = useState<Degrees | undefined>(undefined);

  useEffect(() => {
    if (!currentPosition) {
      return;
    }

    const { speed, heading } = currentPosition.coords;
    if (speed !== null && heading !== null && speed >= MIN_SPEED_FOR_HEADING_MPS) {
      setHeadingDeg(degrees(heading));
    }
  }, [currentPosition]);

  if (!currentPosition) {
    return undefined;
  }

  return {
    lngLat: [currentPosition.coords.longitude, currentPosition.coords.latitude],
    headingDeg,
  };
}
