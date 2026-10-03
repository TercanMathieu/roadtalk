import { setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';

const LANGUAGE = 'fr-FR';

let isAudioModeReady = false;

// Règle la session audio du téléphone pour une consigne de navigation :
// la musique en cours baisse le temps de la phrase au lieu d'être coupée, la
// voix passe même quand le téléphone est en mode silencieux (une consigne
// qu'on n'entend pas est inutile), et reste audible écran verrouillé. Faite
// une fois, au premier usage.
async function prepareAudio(): Promise<void> {
  if (isAudioModeReady) {
    return;
  }
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'duckOthers',
      shouldPlayInBackground: true,
      allowsRecording: false,
    });
    isAudioModeReady = true;
  } catch {
    // La voix reste utilisable avec les réglages par défaut du système.
  }
}

// Dit une consigne. Remplace celle qui serait encore en cours : une phrase
// périmée ("dans 500 mètres…") ne doit pas retarder la suivante.
export function speak(text: string): void {
  prepareAudio()
    .then(() => {
      Speech.stop().catch(() => undefined);
      Speech.speak(text, { language: LANGUAGE });
    })
    .catch(() => undefined);
}

export function stopSpeaking(): void {
  Speech.stop().catch(() => undefined);
}
