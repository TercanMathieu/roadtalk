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

// Recalcule l'itinéraire à chaque changement de destination, en lisant la
// position au moment de l'appel (`originRef.current`) plutôt qu'en
// dépendance : un point GPS reçu entre-temps ne doit pas redéclencher le
// calcul, seul un choix explicite de destination le doit.
export function useRoute(
  destination: AddressSuggestionDto | undefined,
  originRef: RefObject<LastKnownPosition | undefined>,
): RouteState {
  const [route, setRoute] = useState<RouteGeometryDto | undefined>(undefined);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (destination === undefined) {
      setRoute(undefined);
      setError(undefined);
      return;
    }

    const origin = originRef.current;
    if (origin === undefined) {
      // Pas encore de fix GPS : rien à calculer plutôt qu'une erreur —
      // situation transitoire, pas une anomalie.
      setRoute(undefined);
      setError(undefined);
      return;
    }

    let cancelled = false;
    setIsComputing(true);
    setError(undefined);

    withFreshAccessToken((accessToken) =>
      computeRoute(accessToken, origin, { latitude: destination.latitude, longitude: destination.longitude }),
    )
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
  }, [destination, originRef]);

  return { route, isComputing, error };
}
