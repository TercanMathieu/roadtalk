import type { ManeuverDto } from '@roadtalk/contracts';

import type { GuidanceStatus } from './guidance-status';
import { ordinal } from './maneuver-labels';

// Phrases et moments d'annonce du guidage vocal. Fonctions pures, sans module
// natif : ce qui se dit et quand se teste seul (voir useVoiceGuidance pour la
// voix elle-même).

// Vitesse supposée quand le GPS n'en donne pas encore : ~50 km/h.
const DEFAULT_SPEED_MPS = 14;

// Annonce lointaine ("Dans 500 mètres, …") : environ 30 s avant la manœuvre,
// bornée pour ne pas annoncer trop tôt à l'arrêt ni trop tard sur autoroute.
const AHEAD_SECONDS = 30;
const AHEAD_MIN_METERS = 250;
const AHEAD_MAX_METERS = 1200;

// Annonce imminente ("Tournez à droite") : environ 8 s avant — le temps de se
// placer et de réagir à moto.
const SOON_SECONDS = 8;
const SOON_MIN_METERS = 60;
const SOON_MAX_METERS = 250;

// On n'annonce pas de distance quand la manœuvre est déjà presque aussi
// proche que l'annonce imminente : mieux vaut une seule phrase utile.
const AHEAD_SKIP_FACTOR = 1.5;

const ARRIVAL_METERS = 30;

// Ce qui est dit est un fait de voix, pas un fait de carte : pas de nom de
// rue (comme le bandeau), et pas d'annonce pour continuer tout droit.
const SILENT_TYPES: ReadonlySet<ManeuverDto['type']> = new Set(['start', 'continue']);

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const SPOKEN_ACTIONS: Record<ManeuverDto['type'], string> = {
  start: 'démarrez',
  continue: 'continuez tout droit',
  'slight-right': 'tournez légèrement à droite',
  right: 'tournez à droite',
  'sharp-right': 'tournez fortement à droite',
  'slight-left': 'tournez légèrement à gauche',
  left: 'tournez à gauche',
  'sharp-left': 'tournez fortement à gauche',
  uturn: 'faites demi-tour',
  roundabout: 'sortez du rond-point',
  merge: 'rejoignez la voie',
  ferry: 'prenez le ferry',
  destination: 'vous êtes arrivé',
};

// L'action telle qu'on la dit, en minuscules : "tournez à droite", "au
// rond-point, prenez la 2e sortie".
export function spokenAction(maneuver: ManeuverDto): string {
  if (maneuver.roundaboutExitNumber !== undefined) {
    return `au rond-point, prenez la ${ordinal(maneuver.roundaboutExitNumber)} sortie`;
  }
  return SPOKEN_ACTIONS[maneuver.type];
}

// Distance dite à voix haute : arrondie comme on la dirait ("300 mètres",
// "un kilomètre et demi"), jamais "283 mètres".
export function spokenDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    const step = distanceMeters < 150 ? 10 : 50;
    return `${String(Math.max(step, Math.round(distanceMeters / step) * step))} mètres`;
  }

  const kilometers = Math.round(distanceMeters / 500) / 2;
  if (kilometers === 1) {
    return '1 kilomètre';
  }
  const text = Number.isInteger(kilometers) ? String(kilometers) : String(kilometers).replace('.', ',');
  return `${text} kilomètre${kilometers >= 2 ? 's' : ''}`;
}

export interface AnnouncementState {
  // Manœuvre à laquelle se rapportent les drapeaux ci-dessous.
  readonly maneuverIndex: number | undefined;
  readonly hasSpokenAhead: boolean;
  readonly hasSpokenSoon: boolean;
}

export const INITIAL_ANNOUNCEMENT_STATE: AnnouncementState = {
  maneuverIndex: undefined,
  hasSpokenAhead: false,
  hasSpokenSoon: false,
};

export interface AnnouncementInput {
  readonly maneuverIndex: number;
  readonly maneuver: ManeuverDto;
  // Manœuvre enchaînée juste après, quand elle existe (voir RouteProgress).
  readonly thenManeuver: ManeuverDto | undefined;
  readonly distanceMeters: number;
  readonly speedMps: number | undefined;
}

export interface AnnouncementResult {
  readonly text: string | undefined;
  readonly state: AnnouncementState;
}

// Décide s'il faut parler maintenant, à partir de la prochaine manœuvre et de
// la distance qui l'en sépare. Chaque manœuvre est annoncée au plus deux fois
// (de loin, puis juste avant), jamais en boucle.
export function decideAnnouncement(input: AnnouncementInput, previous: AnnouncementState): AnnouncementResult {
  const state: AnnouncementState =
    previous.maneuverIndex === input.maneuverIndex
      ? previous
      : { maneuverIndex: input.maneuverIndex, hasSpokenAhead: false, hasSpokenSoon: false };

  if (SILENT_TYPES.has(input.maneuver.type)) {
    return { text: undefined, state };
  }

  if (input.maneuver.type === 'destination') {
    if (input.distanceMeters <= ARRIVAL_METERS && !state.hasSpokenSoon) {
      return { text: 'Vous êtes arrivé.', state: { ...state, hasSpokenSoon: true } };
    }
    return { text: undefined, state };
  }

  const speed = input.speedMps !== undefined && input.speedMps > 1 ? input.speedMps : DEFAULT_SPEED_MPS;
  const soonThreshold = clamp(speed * SOON_SECONDS, SOON_MIN_METERS, SOON_MAX_METERS);
  const aheadThreshold = clamp(speed * AHEAD_SECONDS, AHEAD_MIN_METERS, AHEAD_MAX_METERS);

  if (input.distanceMeters <= soonThreshold && !state.hasSpokenSoon) {
    const then =
      input.thenManeuver !== undefined && !SILENT_TYPES.has(input.thenManeuver.type)
        ? ` Puis ${spokenAction(input.thenManeuver)}.`
        : '';
    return {
      text: `${capitalize(spokenAction(input.maneuver))}.${then}`,
      // Parler "de près" rend l'annonce de loin inutile si elle n'a pas eu lieu.
      state: { ...state, hasSpokenSoon: true, hasSpokenAhead: true },
    };
  }

  if (
    input.distanceMeters <= aheadThreshold &&
    input.distanceMeters > soonThreshold * AHEAD_SKIP_FACTOR &&
    !state.hasSpokenAhead
  ) {
    return {
      text: `${capitalize(`dans ${spokenDistance(input.distanceMeters)}, ${spokenAction(input.maneuver)}`)}.`,
      state: { ...state, hasSpokenAhead: true },
    };
  }

  return { text: undefined, state };
}

// Annonce de changement d'état du trajet : on prévient une fois en quittant
// l'itinéraire (pas à chaque point GPS), et une fois quand le nouveau tracé
// est prêt.
export function decideStatusAnnouncement(previous: GuidanceStatus, next: GuidanceStatus): string | undefined {
  if (previous === 'on-route' && next !== 'on-route') {
    return "Vous avez quitté l'itinéraire. Recalcul en cours.";
  }
  if (previous !== 'on-route' && next === 'on-route') {
    return 'Nouvel itinéraire.';
  }
  return undefined;
}
