import type { GenerateAiRouteRequestDto } from '@roadtalk/contracts';

// Texte de la demande envoyé au modèle. Fonction pure : ce qui part chez le
// fournisseur d'IA se lit et se teste ici. Aucune coordonnée, aucun
// identifiant : seulement les communes de départ et d'arrivée et les choix du
// formulaire (C4).

// Communes (« Bayonne, Nouvelle-Aquitaine, France »), jamais des coordonnées.
export interface BriefLocalities {
  readonly start: string;
  // Absente : pas d'arrivée imposée.
  readonly destination: string | undefined;
}

const SINUOSITY_TEXT: Record<GenerateAiRouteRequestDto['sinuosity'], string> = {
  direct: 'Routes directes, peu de virages.',
  moderate: 'Quelques virages, sans excès.',
  winding: 'Routes sinueuses, beaucoup de virages.',
  hairpins: 'Le plus sinueux possible : lacets, cols, routes de montagne si la région s’y prête.',
};

const ROAD_PREFERENCE_TEXT: Record<GenerateAiRouteRequestDto['roadPreferences'][number], string> = {
  avoidHighways: 'Éviter autoroutes et voies rapides.',
  goodSurface: 'Privilégier les routes au revêtement en bon état.',
  scenic: 'Privilégier les routes pittoresques (panoramas, gorges, bord de mer…).',
};

const STOP_KIND_TEXT: Record<GenerateAiRouteRequestDto['stopKinds'][number], string> = {
  passes: 'un ou plusieurs cols',
  coffee: 'une halte pour un café',
  viewpoint: 'un point de vue',
};

export function formatDurationForBrief(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours)} h ${String(rest).padStart(2, '0')}`;
}

// Ce qui n'allait pas dans la proposition précédente, pour la seconde et
// dernière tentative. La demande repart à zéro (pas de conversation) : le
// modèle ne voit sa proposition précédente qu'à travers ce résumé.
export type RetryReason =
  | { readonly kind: 'unusable' }
  | { readonly kind: 'not-found' }
  | { readonly kind: 'unreachable'; readonly placeNames: readonly string[] }
  | {
      readonly kind: 'too-short' | 'too-long';
      readonly placeNames: readonly string[];
      readonly actualSeconds: number;
    };

// Ce qui raccourcit ou rallonge la balade dépend de sa forme : autour du
// départ pour une boucle, entre départ et arrivée quand l'arrivée est imposée.
function durationDirection(
  kind: 'too-short' | 'too-long',
  request: Pick<GenerateAiRouteRequestDto, 'tripType' | 'destination'>,
): string {
  if (request.destination !== undefined) {
    return kind === 'too-short'
      ? 'Ajoute des détours entre le départ et l’arrivée.'
      : 'Réduis nettement les détours entre le départ et l’arrivée.';
  }
  if (kind === 'too-short') {
    return 'Élargis nettement le parcours.';
  }
  return request.tripType === 'loop'
    ? 'Resserre nettement le parcours autour du départ.'
    : 'Rapproche nettement l’arrivée du départ.';
}

export function buildRetryFeedback(
  reason: RetryReason,
  request: Pick<GenerateAiRouteRequestDto, 'tripType' | 'destination' | 'durationMinutes'>,
): string {
  switch (reason.kind) {
    case 'unusable':
      return 'La réponse précédente était inexploitable. Respecte strictement le format demandé.';
    case 'not-found':
      return (
        'Trop peu des lieux proposés précédemment ont été retrouvés sur la carte à portée du trajet. ' +
        'Propose uniquement des lieux réels, nommés précisément, avec leur département.'
      );
    case 'unreachable':
      return (
        `Aucune route ne relie les lieux proposés précédemment (${reason.placeNames.join(' → ')}). ` +
        'Propose des lieux accessibles par la route.'
      );
    case 'too-short':
    case 'too-long':
      return (
        `La proposition précédente (${reason.placeNames.join(' → ')}) représente ` +
        `${formatDurationForBrief(Math.round(reason.actualSeconds / 60))} de route pour ` +
        `${formatDurationForBrief(request.durationMinutes)} visées. ${durationDirection(reason.kind, request)}`
      );
  }
}

function tripTypeLine(request: GenerateAiRouteRequestDto, destination: string | undefined): string {
  if (request.tripType === 'loop') {
    return 'Type : boucle, retour au point de départ.';
  }
  if (destination === undefined) {
    return 'Type : aller simple, le dernier lieu proposé est l’arrivée.';
  }
  return (
    `Type : aller simple, arrivée imposée : ${destination}. ` +
    'L’arrivée est ajoutée automatiquement après tes lieux : ne la propose pas.'
  );
}

export function buildRouteBrief(
  request: GenerateAiRouteRequestDto,
  localities: BriefLocalities,
  // Correction demandée après une première proposition inexploitable ou mal
  // calibrée (voir AiRoutesService).
  feedback?: string,
): string {
  const lines = [
    `Départ : ${localities.start}.`,
    tripTypeLine(request, localities.destination),
    `Durée de roulage visée : ${formatDurationForBrief(request.durationMinutes)}.`,
    `Sinuosité : ${SINUOSITY_TEXT[request.sinuosity]}`,
    ...request.roadPreferences.map((preference) => ROAD_PREFERENCE_TEXT[preference]),
  ];

  if (request.stopKinds.length > 0) {
    lines.push(
      `Haltes souhaitées : ${request.stopKinds.map((kind) => STOP_KIND_TEXT[kind]).join(', ')}.`,
    );
  }

  if (request.notes !== undefined && request.notes.length > 0) {
    // Entre guillemets : ce sont les mots du motard, des souhaits à prendre
    // en compte, pas des consignes qui remplaceraient celles du système.
    lines.push(`Précisions du motard : « ${request.notes} »`);
  }

  if (feedback !== undefined) {
    lines.push('', `Correction : ${feedback}`);
  }

  return lines.join('\n');
}
