import { create } from 'zustand';

export type DistanceUnit = 'km' | 'mi';

interface SettingsState {
  readonly distanceUnit: DistanceUnit;
  readonly voiceEnabled: boolean;
  // Préférences sans système derrière pour l'instant (pas de détection de
  // zones de danger, pas de téléchargement de corridor hors-ligne) — la
  // préférence existe et se retient dans l'écran Réglages, mais ne pilote
  // rien d'autre tant que ces fonctionnalités ne sont pas construites.
  readonly dangerAlertsEnabled: boolean;
  readonly corridorAutoDownloadEnabled: boolean;
  readonly setDistanceUnit: (unit: DistanceUnit) => void;
  readonly setVoiceEnabled: (enabled: boolean) => void;
  readonly setDangerAlertsEnabled: (enabled: boolean) => void;
  readonly setCorridorAutoDownloadEnabled: (enabled: boolean) => void;
}

// En mémoire pour l'instant : react-native-mmkv (décidé pour la persistance
// des préférences) est un module natif incompatible avec Expo Go, comme
// MapLibre. Les réglages ne survivent pas à un redémarrage tant que le dev
// client n'est pas en place — à brancher sur MMKV à ce moment-là.
export const useSettingsStore = create<SettingsState>()((set) => ({
  distanceUnit: 'km',
  voiceEnabled: true,
  dangerAlertsEnabled: true,
  corridorAutoDownloadEnabled: true,
  setDistanceUnit: (distanceUnit) => {
    set({ distanceUnit });
  },
  setVoiceEnabled: (voiceEnabled) => {
    set({ voiceEnabled });
  },
  setDangerAlertsEnabled: (dangerAlertsEnabled) => {
    set({ dangerAlertsEnabled });
  },
  setCorridorAutoDownloadEnabled: (corridorAutoDownloadEnabled) => {
    set({ corridorAutoDownloadEnabled });
  },
}));
