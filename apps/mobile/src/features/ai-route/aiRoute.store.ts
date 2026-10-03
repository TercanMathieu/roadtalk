import {
  type AddressSuggestionDto,
  type AiRouteDto,
  ErrorCode,
  type GenerateAiRouteRequestDto,
} from '@roadtalk/contracts';
import { create } from 'zustand';

import { ApiError } from '../../lib/http';
import { withFreshAccessToken } from '../auth/auth.store';
import { generateAiRoute } from './api';

// Lieux choisis dans le formulaire, avec leur nom : la requête n'en garde que
// les coordonnées. `undefined` : la position du motard pour le départ, une
// arrivée laissée au choix de l'IA pour l'arrivée.
export interface ChosenPlaces {
  readonly start: AddressSuggestionDto | undefined;
  readonly destination: AddressSuggestionDto | undefined;
}

interface AiRouteState {
  // Gardés pour « Autre proposition » : mêmes critères, nouvelle génération.
  readonly request: GenerateAiRouteRequestDto | undefined;
  readonly places: ChosenPlaces;
  readonly route: AiRouteDto | undefined;
  readonly isGenerating: boolean;
  // Rejette avec un message affichable (voir aiRouteErrorMessage).
  readonly generate: (
    request: GenerateAiRouteRequestDto,
    places: ChosenPlaces,
  ) => Promise<AiRouteDto>;
}

// Partagé entre le formulaire (qui lance) et l'aperçu (qui affiche et peut
// relancer) : deux écrans de pile distincts, sans prop à faire transiter.
export const useAiRouteStore = create<AiRouteState>((set) => ({
  request: undefined,
  places: { start: undefined, destination: undefined },
  route: undefined,
  isGenerating: false,
  generate: async (request, places) => {
    set({ isGenerating: true });
    try {
      const route = await withFreshAccessToken((accessToken) =>
        generateAiRoute(accessToken, request),
      );
      set({ request, places, route });
      return route;
    } catch (error) {
      throw new Error(aiRouteErrorMessage(error));
    } finally {
      set({ isGenerating: false });
    }
  },
}));

function aiRouteErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Connexion impossible. Vérifie ton réseau et réessaie.';
  }
  switch (error.code) {
    case ErrorCode.AI_ROUTE_QUOTA_EXCEEDED:
      return 'Plus de génération possible aujourd’hui. Réessaie demain.';
    case ErrorCode.AI_ROUTE_DESTINATION_TOO_FAR:
      return 'Arrivée trop loin pour cette durée. Augmente la durée ou choisis une arrivée plus proche.';
    case ErrorCode.AI_ROUTE_GENERATION_FAILED:
      return 'Aucune balade trouvée avec ces critères. Essaie une autre durée ou moins de contraintes.';
    default:
      return 'Génération indisponible pour le moment. Réessaie dans quelques minutes.';
  }
}
