import { type GeolocationPosition, LocationManager, useCurrentPosition } from '@maplibre/maplibre-react-native';
import {
  type Degrees,
  degrees,
  type Meters,
  meters,
  type MetersPerSecond,
  metersPerSecond,
  type TimestampMs,
  timestampMs,
} from '@roadtalk/domain-shared';
import { useEffect, useState } from 'react';

import { useDeviceHeading } from './useDeviceHeading';

// Règle physique du projet : le cap (course) n'est fiable qu'au-dessus
// d'environ 5 km/h — en dessous, le figer plutôt que le laisser tourner
// aléatoirement à l'arrêt (bruit GPS sur `heading`).
const MIN_SPEED_FOR_HEADING_MPS = metersPerSecond(1.39);

// Au-delà de ce délai sans aucune position (ni flux continu, ni repli), on
// force un redémarrage complet du moteur natif plutôt que d'attendre
// indéfiniment. Piste identifiée dans le code natif Android de MapLibre :
// `LocationManager.enable()` revérifie lui-même la permission et échoue
// silencieusement — sans remonter d'erreur côté JS — si cette vérification
// tombe dans la fenêtre, possible juste après l'octroi, où l'OS n'a pas fini
// de propager l'autorisation. `stop()` puis `start()` force un nouvel appel à
// `enable()`, cette fois après coup ; les écouteurs déjà enregistrés
// (ex. useLastKnownPosition) ne sont pas touchés et profitent du redémarrage.
const ENGINE_RESTART_TIMEOUT_MS = 5000;

interface VehiclePosition {
  // [longitude, latitude] — convention GeoJSON/MapLibre, pour les composants
  // qui placent un marqueur sur la carte.
  readonly lngLat: [number, number];
  // Mêmes coordonnées que `lngLat`, mais à plat — pour les consommateurs qui
  // n'ont rien à voir avec MapLibre (ex. calcul de progression sur le
  // trajet, route-progress.ts), pour qui reconstituer depuis le tuple
  // n'apporterait rien.
  readonly latitude: number;
  readonly longitude: number;
  // undefined tant qu'aucun cap fiable n'a encore été observé.
  readonly headingDeg: Degrees | undefined;
  // Vitesse Doppler brute (voir règle physique du projet : jamais dérivée de
  // deux positions) — undefined tant qu'aucune mesure fiable n'est arrivée.
  readonly speedMps: MetersPerSecond | undefined;
  // Rayon d'incertitude horizontale à 68 % — pour le résumé de balade
  // (ride-summary/summarize-track.ts), qui écarte les fixes trop imprécis.
  readonly accuracyMeters: Meters;
  // Altitude ellipsoïdale, bien plus bruitée que la position horizontale.
  readonly altitudeMeters: Meters | undefined;
  readonly recordedAt: TimestampMs;
}

// Réutilise le moteur de localisation natif de MapLibre (même flux que
// <Camera trackUserLocation>) plutôt que d'ouvrir une seconde souscription
// GPS — un seul capteur actif (C1).
export function useVehiclePosition(): VehiclePosition | undefined {
  const currentPosition = useCurrentPosition({ minDisplacement: 5 });
  // Repli le temps que le flux continu livre son premier point — ce qui peut
  // prendre plusieurs secondes (acquisition GPS), et se reproduit à chaque
  // retour au premier plan : le moteur natif se met en pause en arrière-plan
  // (MLRNLocationModule.onHostPause côté Android, équivalent iOS) et repart de
  // zéro à la reprise. `getCurrentPosition()` lit `getLastKnownLocation` côté
  // natif — la dernière position connue du système, en cache, quasi
  // instantanée — plutôt que d'attendre un nouveau fix live.
  const [lastKnownPosition, setLastKnownPosition] = useState<GeolocationPosition | undefined>(undefined);
  // Cap confirmé par le déplacement réel (voir plus bas) — jamais réinitialisé
  // à l'arrêt, seulement remplacé par une nouvelle mesure fiable.
  const [courseHeadingDeg, setCourseHeadingDeg] = useState<Degrees | undefined>(undefined);
  // Cap du téléphone (magnétomètre), utilisé à l'arrêt : sur cet écran de
  // préparation, l'utilisateur ne roule pas encore, `course` ne devient donc
  // quasiment jamais fiable — sans ce repli, le repère resterait figé plein
  // nord en permanence plutôt que de suivre l'orientation du téléphone.
  const compassHeadingDeg = useDeviceHeading();

  useEffect(() => {
    if (currentPosition) {
      return;
    }

    let cancelled = false;

    LocationManager.getCurrentPosition()
      .then((position) => {
        if (!cancelled && position !== undefined) {
          setLastKnownPosition(position);
        }
      })
      .catch(() => {
        // Pas de repli disponible : l'icône reste absente jusqu'au flux continu.
      });

    return () => {
      cancelled = true;
    };
  }, [currentPosition]);

  const position = currentPosition ?? lastKnownPosition;

  useEffect(() => {
    if (position) {
      return;
    }

    const restartId = setTimeout(() => {
      LocationManager.stop();
      LocationManager.start();
    }, ENGINE_RESTART_TIMEOUT_MS);

    return () => {
      clearTimeout(restartId);
    };
  }, [position]);

  useEffect(() => {
    if (!position) {
      return;
    }

    const { speed, heading } = position.coords;
    if (speed !== null && heading !== null && speed >= MIN_SPEED_FOR_HEADING_MPS) {
      setCourseHeadingDeg(degrees(heading));
    }
  }, [position]);

  if (!position) {
    return undefined;
  }

  // Priorité au cap de déplacement seulement s'il est actuellement fiable
  // (vitesse suffisante maintenant, pas juste au dernier point qui l'a
  // établi) — sinon le compas, plus pertinent à l'arrêt ; et si aucun des
  // deux n'est encore disponible, le dernier cap de déplacement connu plutôt
  // que rien.
  const { speed } = position.coords;
  const isMovingFastEnough = speed !== null && speed >= MIN_SPEED_FOR_HEADING_MPS;
  const headingDeg = isMovingFastEnough
    ? courseHeadingDeg
    : (compassHeadingDeg ?? courseHeadingDeg);

  return {
    lngLat: [position.coords.longitude, position.coords.latitude],
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    headingDeg,
    speedMps: speed !== null ? metersPerSecond(speed) : undefined,
    accuracyMeters: meters(position.coords.accuracy),
    altitudeMeters: position.coords.altitude !== null ? meters(position.coords.altitude) : undefined,
    recordedAt: timestampMs(position.timestamp),
  };
}
