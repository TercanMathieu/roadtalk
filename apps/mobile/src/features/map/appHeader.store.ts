import { create } from 'zustand';

export type GpsStatus = 'checking' | 'searching' | 'ok' | 'off';

interface AppHeaderState {
  readonly isVisible: boolean;
  readonly gpsStatus: GpsStatus;
  readonly setVisible: (visible: boolean) => void;
  readonly setGpsStatus: (status: GpsStatus) => void;
}

// Pont entre MapScreen (seul à connaître le statut GPS réel et si le guidage
// actif doit masquer l'en-tête) et le layout des onglets (qui affiche
// AppHeader au-dessus des trois onglets, pas seulement la carte) — même
// raison de pont inter-onglets que pendingRouteLaunch.store.ts.
export const useAppHeaderStore = create<AppHeaderState>((set) => ({
  isVisible: true,
  gpsStatus: 'checking',
  setVisible: (visible) => {
    set({ isVisible: visible });
  },
  setGpsStatus: (status) => {
    set({ gpsStatus: status });
  },
}));
