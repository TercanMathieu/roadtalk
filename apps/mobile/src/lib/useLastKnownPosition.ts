import { type GeolocationPosition, LocationManager } from '@maplibre/maplibre-react-native';
import { type RefObject, useEffect, useRef, useState } from 'react';

export interface LastKnownPosition {
  readonly latitude: number;
  readonly longitude: number;
}

interface LastKnownPositionResult {
  readonly positionRef: RefObject<LastKnownPosition | undefined>;
  // Passe une seule fois de `false` à `true`, au tout premier fix GPS reçu.
  // Sert à déclencher UN SEUL re-rendu des écrans qui attendent une position
  // de départ pour agir (ex. calculer un itinéraire) — sans quoi rien ne les
  // réveille jamais si l'action a été demandée avant ce premier fix : la
  // valeur lue serait `undefined` pour toujours, la ref seule ne redéclenchant
  // aucun rendu quand elle change (c'est justement ce qu'on veut pour le
  // rafraîchissement continu de la position, pas pour ce cas précis).
  readonly hasFix: boolean;
}

// `positionRef` et non un state pour la position elle-même : elle sert à
// paramétrer une requête au moment où elle part, jamais à afficher quoi que
// ce soit. La mettre en state ferait re-rendre l'écran à chaque point GPS et,
// plus grave, relancerait l'effet de recherche à chaque fois que l'utilisateur
// avance de quelques mètres pendant qu'il tape.
// S'abonner ici ne rallume pas un second capteur : LocationManager est un
// singleton qui ne démarre le natif qu'au premier écouteur (C1).
export function useLastKnownPosition(enabled: boolean): LastKnownPositionResult {
  const positionRef = useRef<LastKnownPosition | undefined>(undefined);
  const [hasFix, setHasFix] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleUpdate = (position: GeolocationPosition): void => {
      positionRef.current = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      // Appelé à chaque point GPS, mais React n'effectue qu'un seul rendu :
      // fixer un state à une valeur identique à la précédente (`true` déjà
      // présent) est un no-op reconnu comme tel, pas besoin d'un indicateur
      // séparé pour ne le faire "qu'une fois".
      setHasFix(true);
    };

    LocationManager.addListener(handleUpdate);

    return () => {
      LocationManager.removeListener(handleUpdate);
    };
  }, [enabled]);

  return { positionRef, hasFix };
}
