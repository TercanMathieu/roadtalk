import type { AddressSuggestionDto, RouteGeometryDto } from '@roadtalk/contracts';
import { type RefObject, useEffect, useRef, useState } from 'react';

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
//
// `avoidHighways` en dépendance aussi : changer ce réglage en cours de route
// (ex. depuis les Réglages pendant qu'un itinéraire est déjà affiché) doit
// redemander un tracé au moteur de routage avec le nouveau paramètre.
//
// `rerouteToken` : incrémenté par l'appelant pour redemander un tracé depuis
// la position actuelle sans que rien d'autre n'ait changé (recalcul en
// guidage, après une sortie d'itinéraire). Si ce recalcul échoue (réseau
// dégradé, C3), l'itinéraire en cours est conservé : mieux vaut continuer à
// guider sur l'ancien tracé que de laisser l'écran de guidage vide.
export function useRoute(
  stops: readonly AddressSuggestionDto[],
  originRef: RefObject<LastKnownPosition | undefined>,
  hasOrigin: boolean,
  avoidHighways: boolean,
  rerouteToken: number,
  // Départ choisi sur la carte (balade préparée ailleurs que là où l'on se
  // trouve) ; absent, le trajet part de la position de l'utilisateur.
  customOrigin: LastKnownPosition | undefined,
): RouteState {
  const [route, setRoute] = useState<RouteGeometryDto | undefined>(undefined);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const handledRerouteTokenRef = useRef(rerouteToken);
  const stopCoordinatesKey = [...(customOrigin !== undefined ? [customOrigin] : []), ...stops]
    .map((stop) => `${String(stop.latitude)},${String(stop.longitude)}`)
    .join('|');

  useEffect(() => {
    if (stops.length === 0) {
      setRoute(undefined);
      setError(undefined);
      return;
    }

    // Un recalcul en guidage part toujours de la position actuelle : le
    // départ choisi n'est plus le bon point de départ une fois la balade
    // commencée.
    const isRerouteRequest = rerouteToken !== handledRerouteTokenRef.current;
    const origin = isRerouteRequest ? originRef.current : (customOrigin ?? originRef.current);
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

    const isReroute = rerouteToken !== handledRerouteTokenRef.current;
    handledRerouteTokenRef.current = rerouteToken;

    let cancelled = false;
    setIsComputing(true);
    setError(undefined);

    const waypoints = [
      origin,
      ...stops.map((stop) => ({ latitude: stop.latitude, longitude: stop.longitude })),
    ];

    withFreshAccessToken((accessToken) => computeRoute(accessToken, waypoints, avoidHighways))
      .then((result) => {
        if (!cancelled) {
          setRoute(result);
        }
      })
      .catch(() => {
        if (!cancelled && !isReroute) {
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
  }, [stopCoordinatesKey, originRef, hasOrigin, avoidHighways, rerouteToken]);

  return { route, isComputing, error };
}
