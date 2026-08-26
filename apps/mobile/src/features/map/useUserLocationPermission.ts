import { PermissionStatus, requestForegroundPermissionsAsync } from 'expo-location';
import { useEffect, useState } from 'react';

type PermissionState = 'checking' | 'granted' | 'denied';

// Foreground uniquement : la vue "carte" n'a besoin de la position que pendant
// que l'app est ouverte à l'écran (C1 — pas de tracking background ici, ce
// sera une décision à part pour l'enregistrement de trace).
export function useUserLocationPermission(): PermissionState {
  const [state, setState] = useState<PermissionState>('checking');

  useEffect(() => {
    let cancelled = false;

    requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (!cancelled) {
          setState(status === PermissionStatus.GRANTED ? 'granted' : 'denied');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState('denied');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
