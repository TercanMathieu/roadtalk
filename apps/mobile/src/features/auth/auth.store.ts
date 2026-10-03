import { ErrorCode, type TokenPairDto, type UserDto } from '@roadtalk/contracts';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { ApiError } from '../../lib/http';
import { getMe, setHandle } from '../profile/api';
import { loginWithGoogle, logout, refreshTokenPair } from './api';

const REFRESH_TOKEN_KEY = 'roadtalk_refresh_token';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

interface AuthState {
  readonly status: AuthStatus;
  readonly accessToken: string | undefined;
  // undefined : pas encore su (avant la première résolution de session).
  // null : su, mais l'utilisateur ne l'a pas encore choisi.
  readonly username: string | null | undefined;
  // Tag de l'identifiant "Pseudo#TAG" — renseigné en même temps que username.
  readonly tag: string | undefined;
  // Date (ms) à partir de laquelle l'identifiant pourra être modifié de
  // nouveau ; undefined = modifiable dès maintenant.
  readonly usernameChangeAllowedAt: number | undefined;
  // Présent quand la modération a retiré l'identifiant précédent.
  readonly usernameRejectedAt: number | undefined;
  readonly email: string | undefined;
  readonly provider: UserDto['provider'] | undefined;
  readonly hydrate: () => Promise<void>;
  readonly signInWithGoogle: (idToken: string) => Promise<void>;
  readonly signOut: () => Promise<void>;
  readonly saveHandle: (username: string, tag: string) => Promise<void>;
}

// Seul le refresh token (opaque, rotatif) est persisté sur l'appareil — via
// SecureStore (Keychain/Keystore), jamais AsyncStorage en clair (C4). L'access
// token (15 min) reste en mémoire, régénéré au démarrage via hydrate().
export const useAuthStore = create<AuthState>((set) => ({
  status: 'checking',
  accessToken: undefined,
  username: undefined,
  tag: undefined,
  usernameChangeAllowedAt: undefined,
  usernameRejectedAt: undefined,
  email: undefined,
  provider: undefined,

  hydrate: async () => {
    const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

    if (storedRefreshToken === null) {
      set({ status: 'unauthenticated' });
      return;
    }

    try {
      const accessToken = await refreshAccessToken();
      const me = await getMe(accessToken);
      set({
        status: 'authenticated',
        accessToken,
        ...toProfileState(me),
        email: me.email,
        provider: me.provider,
      });
    } catch {
      // Le refresh token n'est pas effacé ici : s'il a été refusé par le
      // serveur, refreshAccessToken() l'a déjà fait ; sinon l'échec est
      // transitoire (C3) et la session doit survivre au prochain lancement.
      set({ status: 'unauthenticated', accessToken: undefined });
    }
  },

  signInWithGoogle: async (idToken: string) => {
    const tokens = await loginWithGoogle(idToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken);
    const me = await getMe(tokens.accessToken);
    set({
      status: 'authenticated',
      accessToken: tokens.accessToken,
      ...toProfileState(me),
      email: me.email,
      provider: me.provider,
    });
  },

  signOut: async () => {
    const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (storedRefreshToken !== null) {
      // Dégradation gracieuse (C3) : la déconnexion locale doit réussir même
      // si le serveur est injoignable.
      await logout(storedRefreshToken).catch(() => undefined);
    }
    await clearLocalSession();
  },

  saveHandle: async (username: string, tag: string) => {
    const me = await withFreshAccessToken((accessToken) => setHandle(accessToken, username, tag));
    set(toProfileState(me));
  },
}));

async function clearLocalSession(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  useAuthStore.setState({
    status: 'unauthenticated',
    accessToken: undefined,
    username: undefined,
    tag: undefined,
    usernameChangeAllowedAt: undefined,
    usernameRejectedAt: undefined,
    email: undefined,
    provider: undefined,
  });
}

// Seuls refus de POST /auth/refresh qui prouvent que la session est morte.
// Tout le reste (réseau, 5xx, INTERNAL_ERROR) est transitoire : le refresh
// token stocké reste valable et doit être conservé (C3).
const SESSION_ENDED_CODES: ReadonlySet<ErrorCode> = new Set([
  ErrorCode.AUTH_REFRESH_TOKEN_INVALID,
  ErrorCode.AUTH_REFRESH_TOKEN_REUSED,
  ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED,
]);

function isSessionEnded(error: unknown): boolean {
  return error instanceof ApiError && SESSION_ENDED_CODES.has(error.code);
}

function toProfileState(
  me: UserDto,
): Pick<AuthState, 'username' | 'tag' | 'usernameChangeAllowedAt' | 'usernameRejectedAt'> {
  return {
    username: me.username,
    tag: me.tag ?? undefined,
    usernameChangeAllowedAt: me.usernameChangeAllowedAt ?? undefined,
    usernameRejectedAt: me.usernameRejectedAt ?? undefined,
  };
}

// Un seul rafraîchissement en vol à la fois. Nos refresh tokens tournent à
// chaque usage et un jeton révoqué qu'on réutilise est traité comme un vol
// (révocation de toutes les sessions) : deux rafraîchissements concurrents
// présenteraient le même jeton et déconnecteraient l'utilisateur partout.
let refreshInFlight: Promise<string> | undefined;

async function performRefresh(): Promise<string> {
  const storedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (storedRefreshToken === null) {
    await clearLocalSession();
    throw new Error('Aucune session à rafraîchir');
  }

  let tokens: TokenPairDto;
  try {
    tokens = await refreshTokenPair(storedRefreshToken);
  } catch (error) {
    // Effacement local seulement, sans appeler logout : le serveur vient de
    // refuser ce jeton, il n'y a plus rien à révoquer.
    if (isSessionEnded(error)) {
      await clearLocalSession();
    }
    throw error;
  }
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
  // insister ne ferait que boucler. Aucun échec ici ne déconnecte : seul un
  // refus du rafraîchissement lui-même met fin à la session, et c'est
  // refreshAccessToken() qui s'en charge.
  return call(await refreshAccessToken());
}
