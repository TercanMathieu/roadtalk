import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

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
export const useAuthStore = create<AuthState>((set, get) => ({
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
    const { accessToken } = get();
    if (accessToken === undefined) {
      throw new Error('Non authentifié');
    }
    const me = await apiSetUsername(accessToken, username);
    set({ username: me.username });
  },
}));
