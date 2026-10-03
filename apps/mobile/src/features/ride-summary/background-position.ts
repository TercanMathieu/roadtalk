import { useEffect, useState } from 'react';

// Dernière position livrée par la tâche de localisation d'arrière-plan
// (background-recording.ts). Le flux de position de la carte s'arrête quand
// l'app quitte l'écran : sans ceci, ni la progression sur l'itinéraire, ni
// la voix, ni le recalcul n'avanceraient écran verrouillé.
export interface BackgroundPosition {
  readonly latitude: number;
  readonly longitude: number;
  readonly speedMps: number | undefined;
  readonly recordedAt: number;
}

type Listener = (position: BackgroundPosition) => void;

const listeners = new Set<Listener>();

export function publishBackgroundPosition(position: BackgroundPosition): void {
  for (const listener of listeners) {
    listener(position);
  }
}

export function useBackgroundPosition(): BackgroundPosition | undefined {
  const [position, setPosition] = useState<BackgroundPosition | undefined>(undefined);

  useEffect(() => {
    listeners.add(setPosition);
    return () => {
      listeners.delete(setPosition);
    };
  }, []);

  return position;
}
