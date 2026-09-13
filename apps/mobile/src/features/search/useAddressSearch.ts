import type { AddressSuggestionDto } from '@roadtalk/contracts';
import { type RefObject, useEffect, useState } from 'react';

import type { LastKnownPosition } from '../../lib/useLastKnownPosition';
import { withFreshAccessToken } from '../auth/auth.store';
import { searchAddresses } from './api';

// Anti-rebond : on n'interroge le géocodeur qu'une fois la frappe posée. Ce
// n'est pas qu'un confort — l'instance interrogée est communautaire, une
// requête par lettre serait à la fois inutile et discourtois.
const DEBOUNCE_MS = 350;

// Même seuil que `addressSearchQuerySchema` côté API : inutile d'envoyer une
// requête que le serveur rejettera.
const MIN_QUERY_LENGTH = 3;

interface AddressSearch {
  readonly query: string;
  readonly results: readonly AddressSuggestionDto[];
  readonly isSearching: boolean;
  readonly error: string | undefined;
  readonly setQuery: (value: string) => void;
  readonly clear: () => void;
}

// `originRef` plutôt qu'une valeur : la position est lue au moment où la
// requête part, donc toujours la plus fraîche, sans faire partie des
// dépendances de l'effet — sinon chaque point GPS relancerait une recherche
// pendant la frappe.
export function useAddressSearch(
  originRef: RefObject<LastKnownPosition | undefined>,
): AddressSearch {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<readonly AddressSuggestionDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(undefined);
      setIsSearching(false);
      return;
    }

    // `cancelled` couvre la course entre deux frappes : une réponse lente
    // partie avant la dernière saisie ne doit pas écraser un résultat plus
    // récent, ni rallumer l'indicateur de chargement.
    let cancelled = false;
    setIsSearching(true);

    const timer = setTimeout(() => {
      const origin = originRef.current;

      withFreshAccessToken((accessToken) => searchAddresses(accessToken, trimmed, origin))
        .then((response) => {
          if (!cancelled) {
            setResults(response.results);
            setError(undefined);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
            setError('Recherche indisponible, réessaie.');
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearching(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, originRef]);

  return {
    query,
    results,
    isSearching,
    error,
    setQuery,
    clear: () => {
      setQuery('');
    },
  };
}
