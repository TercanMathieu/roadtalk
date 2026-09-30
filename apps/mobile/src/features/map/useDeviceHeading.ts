import { type Degrees, degrees } from '@roadtalk/domain-shared';
import { type LocationHeadingObject, watchHeadingAsync } from 'expo-location';
import { useEffect, useState } from 'react';

// 0 = « aucune fiabilité » (voir LocationHeadingObject.accuracy) : pas
// différent d'une absence de donnée, on l'ignore plutôt que de l'afficher.
const MIN_HEADING_ACCURACY = 1;

// Cap venant du magnétomètre plutôt que du déplacement GPS (`course`, voir
// useVehiclePosition) — utile à l'arrêt, où `course` reste figé faute d'être
// fiable en dessous de ~5 km/h (écran de préparation : l'utilisateur ne roule
// pas encore). Coût batterie négligeable comparé au GPS : aucun capteur de
// localisation n'est réveillé, seul le magnétomètre déjà présent sur tout
// téléphone (C1).
export function useDeviceHeading(): Degrees | undefined {
  const [headingDeg, setHeadingDeg] = useState<Degrees | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    let subscription: { remove: () => void } | undefined;

    watchHeadingAsync((heading: LocationHeadingObject) => {
      if (heading.accuracy < MIN_HEADING_ACCURACY) {
        return;
      }

      // `trueHeading` (nord géographique) nécessite la permission de
      // localisation, déjà acquise à ce stade ; -1 signale son absence —
      // repli sur le nord magnétique plutôt que d'afficher une valeur
      // aberrante.
      const value = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading;
      setHeadingDeg(degrees(value));
    })
      .then((sub) => {
        if (cancelled) {
          sub.remove();
          return;
        }
        subscription = sub;
      })
      .catch(() => {
        // Pas de magnétomètre disponible : le cap GPS (course) reste seul
        // utilisé, voir useVehiclePosition.
      });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return headingDeg;
}
