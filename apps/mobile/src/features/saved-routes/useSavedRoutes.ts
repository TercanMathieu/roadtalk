import type { RouteDto } from '@roadtalk/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';

import { withFreshAccessToken } from '../auth/auth.store';
import { deleteRoute, listRoutes } from './api';

interface SavedRoutes {
  readonly routes: readonly RouteDto[];
  readonly isLoading: boolean;
  readonly error: string | undefined;
  readonly refresh: () => void;
  // Optimiste, même logique que useRideHistory.removeRide.
  readonly removeRoute: (id: string) => void;
}

export function useSavedRoutes(): SavedRoutes {
  const [routes, setRoutes] = useState<readonly RouteDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const requestIdRef = useRef(0);

  const refresh = useCallback((): void => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(undefined);

    withFreshAccessToken((accessToken) => listRoutes(accessToken))
      .then((response) => {
        if (requestIdRef.current === requestId) {
          setRoutes(response);
        }
      })
      .catch(() => {
        if (requestIdRef.current === requestId) {
          setRoutes([]);
          setError('Itinéraires indisponibles.');
        }
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const removeRoute = useCallback(
    (id: string): void => {
      const previous = routes;
      setRoutes((current) => current.filter((route) => route.id !== id));

      withFreshAccessToken((accessToken) => deleteRoute(accessToken, id)).catch(() => {
        setRoutes(previous);
        setError('Suppression impossible.');
      });
    },
    [routes],
  );

  return { routes, isLoading, error, refresh, removeRoute };
}
