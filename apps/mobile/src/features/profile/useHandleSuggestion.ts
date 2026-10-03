import { ErrorCode, type HandleSuggestionDto, usernameSchema } from '@roadtalk/contracts';
import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '../../lib/http';
import { withFreshAccessToken } from '../auth/auth.store';
import { getHandleSuggestion } from './api';

// Laisse finir de taper avant d'interroger le serveur : une requête par
// frappe serait du trafic inutile (C1) et ferait clignoter l'aperçu.
const DEBOUNCE_MS = 400;

export type HandleCheck =
  // Rien à vérifier : champ vide, format invalide, ou pseudo inchangé.
  | { readonly status: 'idle' }
  | { readonly status: 'checking' }
  | { readonly status: 'available'; readonly suggestion: HandleSuggestionDto }
  // Refusé par le filtre du serveur (mot interdit, nom réservé).
  | { readonly status: 'not-allowed' }
  // Trop de comptes portent déjà ce pseudo : plus de tag libre.
  | { readonly status: 'saturated' }
  | { readonly status: 'unreachable' };

interface HandleSuggestion {
  readonly check: HandleCheck;
  // Redemande un tag pour le même pseudo ("Autre tag").
  readonly redraw: () => void;
}

// Vérifie auprès du serveur le pseudo en cours de saisie et récupère le tag
// qu'il lui propose. `enabled` à false (pseudo inchangé, fiche verrouillée)
// coupe toute requête.
export function useHandleSuggestion(username: string, enabled: boolean): HandleSuggestion {
  const [check, setCheck] = useState<HandleCheck>({ status: 'idle' });
  const [drawCount, setDrawCount] = useState(0);
  const isValidFormat = usernameSchema.safeParse(username).success;

  useEffect(() => {
    if (!enabled || !isValidFormat) {
      setCheck({ status: 'idle' });
      return;
    }

    let cancelled = false;
    setCheck({ status: 'checking' });

    const timeoutId = setTimeout(() => {
      withFreshAccessToken((accessToken) => getHandleSuggestion(accessToken, username))
        .then((suggestion) => {
          if (!cancelled) {
            setCheck({ status: 'available', suggestion });
          }
        })
        .catch((error: unknown) => {
          if (cancelled) {
            return;
          }
          if (error instanceof ApiError && error.code === ErrorCode.USERNAME_NOT_ALLOWED) {
            setCheck({ status: 'not-allowed' });
          } else if (error instanceof ApiError && error.code === ErrorCode.USERNAME_ALREADY_TAKEN) {
            setCheck({ status: 'saturated' });
          } else {
            setCheck({ status: 'unreachable' });
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [username, enabled, isValidFormat, drawCount]);

  const redraw = useCallback((): void => {
    setDrawCount((count) => count + 1);
  }, []);

  return { check, redraw };
}
