import { ErrorCode, type FriendsOverviewDto, type PublicUserDto } from '@roadtalk/contracts';
import { create } from 'zustand';

import { ApiError } from '../../lib/http';
import { withFreshAccessToken } from '../auth/auth.store';
import { getFriends } from './api';

interface FriendsState {
  readonly overview: FriendsOverviewDto | undefined;
  readonly refresh: () => Promise<void>;
  // Lance une action sur les amis et adopte l'état renvoyé par le serveur.
  // Rejette avec un message affichable (voir friendsErrorMessage).
  readonly run: (
    action: (accessToken: string) => Promise<FriendsOverviewDto>,
  ) => Promise<FriendsOverviewDto>;
}

// Partagé entre l'en-tête (pastille des demandes reçues) et l'écran Amis.
export const useFriendsStore = create<FriendsState>((set) => ({
  overview: undefined,
  refresh: async () => {
    const overview = await withFreshAccessToken(getFriends);
    set({ overview });
  },
  run: async (action) => {
    try {
      const overview = await withFreshAccessToken(action);
      set({ overview });
      return overview;
    } catch (error) {
      throw new Error(friendsErrorMessage(error));
    }
  },
}));

// « Pseudo#TAG », ou une mention neutre quand la modération a retiré
// l'identifiant de ce motard.
export function formatHandle(user: PublicUserDto): string {
  return user.username !== null && user.tag !== null
    ? `${user.username}#${user.tag}`
    : 'Pseudo retiré';
}

function friendsErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return 'Connexion impossible. Vérifie ton réseau et réessaie.';
  }
  switch (error.code) {
    // Message du serveur : il précise le cas (déjà amis, demande en cours,
    // propre identifiant…), le code suffit à savoir qu'il est affichable.
    case ErrorCode.FRIEND_HANDLE_NOT_FOUND:
    case ErrorCode.FRIEND_REQUEST_INVALID:
    case ErrorCode.FRIEND_ALREADY_CONNECTED:
    case ErrorCode.FRIEND_REQUEST_LIMIT:
      return error.message;
    case ErrorCode.FRIEND_REQUEST_NOT_FOUND:
      return 'Cette demande n’existe plus.';
    default:
      return 'Action impossible pour le moment. Réessaie.';
  }
}
