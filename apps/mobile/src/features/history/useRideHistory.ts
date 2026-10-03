import type { RideListItemDto } from '@roadtalk/contracts';
import { useCallback, useRef, useState } from 'react';

import { withFreshAccessToken } from '../auth/auth.store';
import { deleteRide, listRides, renameRide as renameRideRequest, setRideFavorite } from './api';

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
  // Même logique optimiste. `name` déjà nettoyé et non vide (voir l'appelant).
  readonly renameRide: (id: string, name: string) => void;
}

// Ne charge rien d'elle-même : l'écran appelle `refresh` à chaque affichage
// (voir HistoryScreen).
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
        // La liste déjà affichée reste en place : un échec réseau passager
        // ne doit pas la vider (C3).
        if (requestIdRef.current === requestId) {
          setError('Historique indisponible.');
        }
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      });
  }, []);

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

  const renameRide = useCallback((id: string, name: string): void => {
    const previous = rides;
    setRides((current) => current.map((ride) => (ride.id === id ? { ...ride, name } : ride)));

    withFreshAccessToken((accessToken) => renameRideRequest(accessToken, id, name)).catch(() => {
      setRides(previous);
      setError('Renommage impossible.');
    });
  }, [rides]);

  return { rides, isLoading, error, refresh, removeRide, toggleFavorite, renameRide };
}
