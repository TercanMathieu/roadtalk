import type { AddressSuggestionDto } from '@roadtalk/contracts';
import { create } from 'zustand';

export interface PendingRouteLaunch {
  readonly stops: readonly AddressSuggestionDto[];
  readonly avoidHighways: boolean;
}

interface PendingRouteLaunchState {
  readonly pending: PendingRouteLaunch | undefined;
  readonly setPending: (launch: PendingRouteLaunch) => void;
  // Lit et efface en un seul geste : évite de relancer le même itinéraire
  // une seconde fois si l'écran carte se re-rend après consommation.
  readonly consume: () => PendingRouteLaunch | undefined;
}

// Pont entre l'onglet Balades (où on choisit de relancer un itinéraire
// enregistré) et l'onglet Itinéraire (qui doit alors pré-remplir ses
// arrêts) — les deux sont des écrans d'onglets distincts dans Expo Router,
// sans prop à faire transiter entre eux autrement.
export const usePendingRouteLaunchStore = create<PendingRouteLaunchState>((set, get) => ({
  pending: undefined,
  setPending: (launch) => {
    set({ pending: launch });
  },
  consume: () => {
    const current = get().pending;
    set({ pending: undefined });
    return current;
  },
}));
