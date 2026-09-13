import { ErrorCode } from '@roadtalk/contracts';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { ApiError } from '../../lib/http';
import { getMe, setUsername as apiSetUsername } from '../profile/api';
import { loginWithGoogle, logout, refreshTokenPair } from './api';

const REFRESH_TOKEN_KEY = 'roadtalk_refresh_token';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

interface AuthState {
  readonly status: AuthStatus;
  readonly accessToken: string | undefined;
  // undefined : pas encore su (avant la première résolution de session).
  // null : su, mais l'utilisateur ne l'a pas encore choisi.
  readonly username: string | null | undefined;
  readonly hydrate: () => Promise<void>;
  readonly signInWithGoogle: (idToken: string) => Promise<void>;
  readonly signOut: () => Promise<void>;
  readonly chooseUsername: (username: string) => Promise<void>;
}

// Seul le refresh token (opaque, rotatif) est persisté sur l'appareil — via
// SecureStore (Keychain/Keystore), jamais AsyncStorage en clair (C4). L'access
// token (15 min) reste en mémoire, régénéré au démarrage via hydrate().
export const useAuthStore = create<AuthState>((set) => ({
  status: 'checking',
  accessToken: undefined,
  username: undefined,

  hydrate: async () => {
    const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

    if (storedRefreshToken === null) {
      set({ status: 'unauthenticated' });
      return;
    }

    try {
      const tokens = await refreshTokenPair(storedRefreshToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
      const me = await getMe(tokens.accessToken);
      set({ status: 'authenticated', accessToken: tokens.accessToken, username: me.username });
    } catch {
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      set({ status: 'unauthenticated' });
    }
  },

  signInWithGoogle: async (idToken: string) => {
    const tokens = await loginWithGoogle(idToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    const me = await getMe(tokens.accessToken);
    set({ status: 'authenticated', accessToken: tokens.accessToken, username: me.username });
  },

  signOut: async () => {
    const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (storedRefreshToken !== null) {
      // Dégradation gracieuse (C3) : la déconnexion locale doit réussir même
      // si le serveur est injoignable.
      await logout(storedRefreshToken).catch(() => undefined);
    }
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    set({ status: 'unauthenticated', accessToken: undefined, username: undefined });
  },

  chooseUsername: async (username: string) => {
    const me = await withFreshAccessToken((accessToken) => apiSetUsername(accessToken, username));
    set({ username: me.username });
  },
}));

// Un seul rafraîchissement en vol à la fois. Nos refresh tokens tournent à
// chaque usage et un jeton révoqué qu'on réutilise est traité comme un vol
// (révocation de toutes les sessions) : deux rafraîchissements concurrents
// présenteraient le même jeton et déconnecteraient l'utilisateur partout.
let refreshInFlight: Promise<string> | undefined;

async function performRefresh(): Promise<string> {
  const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (storedRefreshToken === null) {
    throw new Error('Aucune session à rafraîchir');
  }

  const tokens = await refreshTokenPair(storedRefreshToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
  useAuthStore.setState({ accessToken: tokens.accessToken });

  return tokens.accessToken;
}

function refreshAccessToken(): Promise<string> {
  refreshInFlight ??= performRefresh().finally(() => {
    refreshInFlight = undefined;
  });

  return refreshInFlight;
}

/**
 * Exécute un appel authentifié en gérant l'expiration de l'access token
 * (15 min) : si le serveur le refuse, on en obtient un nouveau et on rejoue
 * l'appel une fois. Passer par ce helper plutôt que de lire `accessToken`
 * directement dans le store.
 */
export async function withFreshAccessToken<T>(
  call: (accessToken: string) => Promise<T>,
): Promise<T> {
  const { accessToken } = useAuthStore.getState();
  if (accessToken === undefined) {
    throw new Error('Non authentifié');
  }

  try {
    return await call(accessToken);
  } catch (error) {
    if (!(error instanceof ApiError) || error.code !== ErrorCode.AUTH_TOKEN_INVALID) {
      throw error;
    }
  }

  // Un seul réessai : si le jeton fraîchement émis est refusé lui aussi,
  // insister ne ferait que boucler.
  try {
    return await call(await refreshAccessToken());
  } catch (error) {
    // La session est morte (refresh expiré, révoqué, ou vol détecté) :
    // déconnecter proprement plutôt que laisser l'app dans un état zombie.
    await useAuthStore.getState().signOut();
    throw error;
  }
}
