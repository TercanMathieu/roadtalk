import { type GeolocationPosition, LocationManager } from '@maplibre/maplibre-react-native';
import { type RefObject, useEffect, useRef } from 'react';

export interface LastKnownPosition {
  readonly latitude: number;
  readonly longitude: number;
}

// Volontairement une ref et non un state : cette position sert à paramétrer
// une requête au moment où elle part, jamais à afficher quoi que ce soit. La
// mettre en state ferait re-rendre l'écran à chaque point GPS et, plus grave,
// relancerait l'effet de recherche à chaque fois que l'utilisateur avance de
// quelques mètres pendant qu'il tape.
// S'abonner ici ne rallume pas un second capteur : LocationManager est un
// singleton qui ne démarre le natif qu'au premier écouteur (C1).
export function useLastKnownPosition(enabled: boolean): RefObject<LastKnownPosition | undefined> {
  const positionRef = useRef<LastKnownPosition | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleUpdate = (position: GeolocationPosition): void => {
      positionRef.current = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    };

    LocationManager.addListener(handleUpdate);

    return () => {
      LocationManager.removeListener(handleUpdate);
    };
  }, [enabled]);

  return positionRef;
}
