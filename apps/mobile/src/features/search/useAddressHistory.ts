import type { AddressHistoryEntryDto } from '@roadtalk/contracts';
import { useCallback, useRef, useState } from 'react';

import { withFreshAccessToken } from '../auth/auth.store';
import { fetchAddressHistory } from './historyApi';

interface AddressHistory {
  readonly entries: readonly AddressHistoryEntryDto[];
  readonly isLoading: boolean;
  readonly error: string | undefined;
  // Déclenché à la demande (ex. au focus de la barre de recherche), pas par
  // un effet automatique — l'historique n'a aucune raison de se recharger
  // pendant que l'utilisateur tape ou regarde ailleurs.
  readonly refresh: () => void;
}

export function useAddressHistory(): AddressHistory {
  const [entries, setEntries] = useState<readonly AddressHistoryEntryDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  // `refresh` étant appelé impérativement (pas depuis un effet), on ne peut
  // pas s'appuyer sur un nettoyage d'effet pour ignorer une réponse devenue
  // obsolète — un compteur de requête joue le même rôle.
  const requestIdRef = useRef(0);

  const refresh = useCallback((): void => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(undefined);

    withFreshAccessToken((accessToken) => fetchAddressHistory(accessToken))
      .then((response) => {
        if (requestIdRef.current === requestId) {
          setEntries(response.entries);
        }
      })
      .catch(() => {
        if (requestIdRef.current === requestId) {
          setEntries([]);
          setError('Historique indisponible.');
        }
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      });
  }, []);

  return { entries, isLoading, error, refresh };
}
