import type { AddressSuggestionDto, RouteGeometryDto } from '@roadtalk/contracts';
import { type RefObject, useEffect, useState } from 'react';

import type { LastKnownPosition } from '../../lib/useLastKnownPosition';
import { withFreshAccessToken } from '../auth/auth.store';
import { computeRoute } from './api';

interface RouteState {
  readonly route: RouteGeometryDto | undefined;
  readonly isComputing: boolean;
  readonly error: string | undefined;
}

// Recalcule l'itinéraire à chaque changement des *coordonnées* des arrêts, en
// lisant la position au moment de l'appel (`originRef.current`) plutôt qu'en
// dépendance : un point GPS reçu entre-temps ne doit pas redéclencher le
// calcul, seul un ajout/retrait/déplacement explicite d'arrêt le doit.
//
// Dépendre d'une clé dérivée des coordonnées plutôt que de la référence de
// `stops` directement : un arrêt ajouté par appui sur la carte reçoit
// d'abord un libellé de repli (coordonnées), puis son vrai nom une fois le
// géocodage inverse résolu (MapScreen.handleMapLongPress) — un nouveau
// libellé change la référence de `stops` sans changer le trajet à calculer,
// et recalculer dans ce cas serait un appel réseau inutile en plus d'un
// clignotement des statistiques déjà affichées.
//
// `hasOrigin` est bien nécessaire en dépendance, lui : si le premier arrêt
// est ajouté avant le tout premier fix GPS, `originRef.current` vaut
// `undefined` au moment où cet effet s'exécute, et rien ne le redéclenche
// jamais quand le fix finit par arriver — la ref changeant silencieusement,
// sans re-rendu. `hasOrigin` est le seul signal qui bascule alors de `false`
// à `true` et relance ce calcul.
export function useRoute(
  stops: readonly AddressSuggestionDto[],
  originRef: RefObject<LastKnownPosition | undefined>,
  hasOrigin: boolean,
): RouteState {
  const [route, setRoute] = useState<RouteGeometryDto | undefined>(undefined);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const stopCoordinatesKey = stops
    .map((stop) => `${String(stop.latitude)},${String(stop.longitude)}`)
    .join('|');

  useEffect(() => {
    if (stops.length === 0) {
      setRoute(undefined);
      setError(undefined);
      return;
    }

    const origin = originRef.current;
    if (origin === undefined) {
      // Pas encore de fix GPS (hasOrigin vient de basculer à `true` mais la
      // ref n'a pas eu le temps d'être écrite, ou l'appelant est mal
      // synchronisé) : rien à calculer plutôt qu'une erreur — situation
      // transitoire, pas une anomalie. `hasOrigin` en dépendance garantit que
      // ce cas se rejoue dès que la position devient réellement disponible.
      setRoute(undefined);
      setError(undefined);
      return;
    }

    let cancelled = false;
    setIsComputing(true);
    setError(undefined);

    const waypoints = [
      origin,
      ...stops.map((stop) => ({ latitude: stop.latitude, longitude: stop.longitude })),
    ];

    withFreshAccessToken((accessToken) => computeRoute(accessToken, waypoints))
      .then((result) => {
        if (!cancelled) {
          setRoute(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRoute(undefined);
          setError("Itinéraire indisponible, réessaie.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsComputing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [stopCoordinatesKey, originRef, hasOrigin]);

  return { route, isComputing, error };
}
