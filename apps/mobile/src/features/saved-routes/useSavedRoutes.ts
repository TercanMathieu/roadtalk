import type { RouteDto } from '@roadtalk/contracts';
import { useCallback, useRef, useState } from 'react';

import { withFreshAccessToken } from '../auth/auth.store';
import { deleteRoute, listRoutes, renameRoute as renameRouteRequest, setRouteFavorite } from './api';

interface SavedRoutes {
  readonly routes: readonly RouteDto[];
  readonly isLoading: boolean;
  readonly error: string | undefined;
  readonly refresh: () => void;
  // Optimiste, même logique que useRideHistory.removeRide.
  readonly removeRoute: (id: string) => void;
  // Optimiste aussi. `name` déjà nettoyé et non vide (voir l'appelant).
  readonly renameRoute: (id: string, name: string) => void;
  // Optimiste aussi, même logique que useRideHistory.toggleFavorite.
  readonly toggleFavorite: (id: string) => void;
}

// Ne charge rien d'elle-même : l'écran appelle `refresh` à chaque affichage
// (voir HistoryScreen).
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
        // La liste déjà affichée reste en place : un échec réseau passager
        // ne doit pas la vider (C3).
        if (requestIdRef.current === requestId) {
          setError('Itinéraires indisponibles.');
        }
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      });
  }, []);

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

  const renameRoute = useCallback(
    (id: string, name: string): void => {
      const previous = routes;
      setRoutes((current) => current.map((route) => (route.id === id ? { ...route, name } : route)));

      withFreshAccessToken((accessToken) => renameRouteRequest(accessToken, id, name)).catch(() => {
        setRoutes(previous);
        setError('Renommage impossible.');
      });
    },
    [routes],
  );

  const toggleFavorite = useCallback(
    (id: string): void => {
      const previous = routes;
      const target = previous.find((route) => route.id === id);
      if (target === undefined) {
        return;
      }
      const nextIsFavorite = !target.isFavorite;
      setRoutes((current) =>
        current.map((route) => (route.id === id ? { ...route, isFavorite: nextIsFavorite } : route)),
      );

      withFreshAccessToken((accessToken) => setRouteFavorite(accessToken, id, nextIsFavorite)).catch(() => {
        setRoutes(previous);
        setError('Mise à jour du favori impossible.');
      });
    },
    [routes],
  );

  return { routes, isLoading, error, refresh, removeRoute, renameRoute, toggleFavorite };
}
