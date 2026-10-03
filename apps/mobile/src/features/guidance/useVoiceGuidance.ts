import { useEffect, useRef } from 'react';

import type { GuidanceStatus } from './guidance-status';
import type { RouteProgress } from './route-progress';
import { speak, stopSpeaking } from './voice';
import {
  type AnnouncementState,
  decideAnnouncement,
  decideStatusAnnouncement,
  INITIAL_ANNOUNCEMENT_STATE,
} from './voice-announcements';

interface Props {
  // Faux : réglage coupé, ou pas de guidage en cours — rien n'est dit.
  readonly enabled: boolean;
  readonly progress: RouteProgress | undefined;
  readonly speedMps: number | undefined;
  readonly status: GuidanceStatus;
}

// Dit les consignes du guidage à mesure que la position avance. S'appuie sur
// les mêmes données que le bandeau (RouteProgress) : ce que la voix annonce
// est exactement ce que l'écran montre.
export function useVoiceGuidance({ enabled, progress, speedMps, status }: Props): void {
  const stateRef = useRef<AnnouncementState>(INITIAL_ANNOUNCEMENT_STATE);
  const previousStatusRef = useRef<GuidanceStatus>('on-route');

  // Fin du guidage ou réglage coupé : on se tait tout de suite, et la
  // prochaine balade repart de zéro.
  useEffect(() => {
    if (!enabled) {
      stopSpeaking();
      stateRef.current = INITIAL_ANNOUNCEMENT_STATE;
      previousStatusRef.current = 'on-route';
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const message = decideStatusAnnouncement(previousStatusRef.current, status);
    previousStatusRef.current = status;
    if (message !== undefined) {
      speak(message);
    }
  }, [enabled, status]);

  useEffect(() => {
    // Hors itinéraire, la manœuvre affichée n'est plus la bonne : le bandeau
    // la remplace par l'état, et la voix fait de même.
    if (!enabled || status !== 'on-route' || progress === undefined) {
      return;
    }
    const { nextManeuver, nextManeuverIndex, distanceToNextManeuver, thenManeuver } = progress;
    if (nextManeuver === undefined || nextManeuverIndex === undefined || distanceToNextManeuver === undefined) {
      return;
    }

    const result = decideAnnouncement(
      {
        maneuverIndex: nextManeuverIndex,
        maneuver: nextManeuver,
        thenManeuver,
        distanceMeters: distanceToNextManeuver,
        speedMps,
      },
      stateRef.current,
    );
    stateRef.current = result.state;
    if (result.text !== undefined) {
      speak(result.text);
    }
  }, [enabled, status, progress, speedMps]);
}
