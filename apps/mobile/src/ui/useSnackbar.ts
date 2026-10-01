import { useCallback, useRef, useState } from 'react';

const AUTO_HIDE_MS = 2600;

interface Snackbar {
  readonly message: string | undefined;
  readonly show: (text: string) => void;
}

// File d'un seul message à la fois : une nouvelle notification remplace et
// relance le délai plutôt que de s'empiler, cohérent avec l'unique
// emplacement prévu par le design.
export function useSnackbar(): Snackbar {
  const [message, setMessage] = useState<string | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback((text: string) => {
    if (timeoutRef.current !== undefined) {
      clearTimeout(timeoutRef.current);
    }

    setMessage(text);
    timeoutRef.current = setTimeout(() => {
      setMessage(undefined);
    }, AUTO_HIDE_MS);
  }, []);

  return { message, show };
}
