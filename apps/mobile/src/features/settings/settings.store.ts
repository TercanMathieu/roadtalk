import { create } from 'zustand';

export type DistanceUnit = 'km' | 'mi';

interface SettingsState {
  readonly distanceUnit: DistanceUnit;
  readonly voiceEnabled: boolean;
  readonly setDistanceUnit: (unit: DistanceUnit) => void;
  readonly setVoiceEnabled: (enabled: boolean) => void;
}

// En mémoire pour l'instant : react-native-mmkv (décidé pour la persistance
// des préférences) est un module natif incompatible avec Expo Go, comme
// MapLibre. Les réglages ne survivent pas à un redémarrage tant que le dev
// client n'est pas en place — à brancher sur MMKV à ce moment-là.
export const useSettingsStore = create<SettingsState>()((set) => ({
  distanceUnit: 'km',
  voiceEnabled: true,
  setDistanceUnit: (distanceUnit) => {
    set({ distanceUnit });
  },
  setVoiceEnabled: (voiceEnabled) => {
    set({ voiceEnabled });
  },
}));
