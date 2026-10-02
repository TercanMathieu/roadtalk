import type { RideListItemDto } from '@roadtalk/contracts';
import { useCallback, useEffect, useRef, useState } from 'react';

import { withFreshAccessToken } from '../auth/auth.store';
import { deleteRide, listRides, setRideFavorite } from './api';

interface RideHistory {
  readonly rides: readonly RideListItemDto[];
  readonly isLoading: boolean;
  readonly error: string | undefined;
  readonly refresh: () => void;
  // Optimiste : retire la ligne immédiatement, la restaure si l'appel échoue
  // — l'utilisateur n'attend pas un aller-retour réseau pour voir l'effet de
  // son geste (C3, dégradation gracieuse explicite si ça échoue vraiment).
  readonly removeRide: (id: string) => void;
  // Même logique optimiste que removeRide.
  readonly toggleFavorite: (id: string) => void;
}

export function useRideHistory(): RideHistory {
  const [rides, setRides] = useState<readonly RideListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const requestIdRef = useRef(0);

  const refresh = useCallback((): void => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(undefined);

    withFreshAccessToken((accessToken) => listRides(accessToken))
      .then((response) => {
        if (requestIdRef.current === requestId) {
          setRides(response);
        }
      })
      .catch(() => {
        if (requestIdRef.current === requestId) {
          setRides([]);
          setError('Historique indisponible.');
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

  const removeRide = useCallback((id: string): void => {
    const previous = rides;
    setRides((current) => current.filter((ride) => ride.id !== id));

    withFreshAccessToken((accessToken) => deleteRide(accessToken, id)).catch(() => {
      setRides(previous);
      setError('Suppression impossible.');
    });
  }, [rides]);

  const toggleFavorite = useCallback((id: string): void => {
    const previous = rides;
    const target = previous.find((ride) => ride.id === id);
    if (target === undefined) {
      return;
    }
    const nextIsFavorite = !target.isFavorite;
    setRides((current) => current.map((ride) => (ride.id === id ? { ...ride, isFavorite: nextIsFavorite } : ride)));

    withFreshAccessToken((accessToken) => setRideFavorite(accessToken, id, nextIsFavorite)).catch(() => {
      setRides(previous);
      setError('Mise à jour du favori impossible.');
    });
  }, [rides]);

  return { rides, isLoading, error, refresh, removeRide, toggleFavorite };
}
