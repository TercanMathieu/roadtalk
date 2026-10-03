import { ErrorCode, type TokenPairDto, type UserDto } from '@roadtalk/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const secureStore = vi.hoisted(() => new Map<string, string>());

vi.mock('expo-secure-store', () => ({
  getItemAsync: (key: string) => Promise.resolve(secureStore.get(key) ?? null),
  setItemAsync: (key: string, value: string) => {
    secureStore.set(key, value);
    return Promise.resolve();
  },
  deleteItemAsync: (key: string) => {
    secureStore.delete(key);
    return Promise.resolve();
  },
}));

// apiUrl importe expo-constants, qui ne se charge pas hors runtime React Native.
vi.mock('../../../src/lib/apiUrl', () => ({ API_BASE_URL: 'http://api.test' }));

vi.mock('../../../src/features/auth/api', () => ({
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
  refreshTokenPair: vi.fn(),
}));

vi.mock('../../../src/features/profile/api', () => ({
  getMe: vi.fn(),
  setUsername: vi.fn(),
}));

import { logout, refreshTokenPair } from '../../../src/features/auth/api';
import { useAuthStore, withFreshAccessToken } from '../../../src/features/auth/auth.store';
import { getMe } from '../../../src/features/profile/api';
import { ApiError } from '../../../src/lib/http';

const REFRESH_TOKEN_KEY = 'roadtalk_refresh_token';

const NEW_TOKENS: TokenPairDto = { accessToken: 'access-2', refreshToken: 'refresh-2' };

function apiError(code: ErrorCode): ApiError {
  return new ApiError({ code, message: code });
}

function expiredThenOk(): (accessToken: string) => Promise<string> {
  return vi.fn((accessToken: string) =>
    accessToken === 'access-1'
      ? Promise.reject(apiError(ErrorCode.AUTH_TOKEN_INVALID))
      : Promise.resolve(`ok:${accessToken}`),
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  secureStore.clear();
  secureStore.set(REFRESH_TOKEN_KEY, 'refresh-1');
  useAuthStore.setState({
    status: 'authenticated',
    accessToken: 'access-1',
    username: 'pilote',
    email: 'pilote@example.test',
    provider: 'google',
  });
});

describe('withFreshAccessToken', () => {
  it("rafraîchit et rejoue l'appel quand l'access token est refusé", async () => {
    vi.mocked(refreshTokenPair).mockResolvedValue(NEW_TOKENS);

    await expect(withFreshAccessToken(expiredThenOk())).resolves.toBe('ok:access-2');

    expect(secureStore.get(REFRESH_TOKEN_KEY)).toBe('refresh-2');
    expect(useAuthStore.getState().accessToken).toBe('access-2');
  });

  it('ne rafraîchit pas pour une erreur sans rapport avec le jeton', async () => {
    const failure = apiError(ErrorCode.ROUTE_NOT_FOUND);

    await expect(withFreshAccessToken(() => Promise.reject(failure))).rejects.toBe(failure);

    expect(refreshTokenPair).not.toHaveBeenCalled();
  });

  it.each([
    ['une erreur réseau', new TypeError('Network request failed')],
    ['une erreur serveur', apiError(ErrorCode.INTERNAL_ERROR)],
  ])('conserve la session quand le rafraîchissement échoue sur %s', async (_label, failure) => {
    vi.mocked(refreshTokenPair).mockRejectedValue(failure);

    await expect(withFreshAccessToken(expiredThenOk())).rejects.toBe(failure);

    expect(secureStore.get(REFRESH_TOKEN_KEY)).toBe('refresh-1');
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().username).toBe('pilote');
    expect(logout).not.toHaveBeenCalled();
  });

  it.each([
    ErrorCode.AUTH_REFRESH_TOKEN_INVALID,
    ErrorCode.AUTH_REFRESH_TOKEN_REUSED,
    ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED,
  ])('déconnecte localement quand le rafraîchissement est refusé avec %s', async (code) => {
    const failure = apiError(code);
    vi.mocked(refreshTokenPair).mockRejectedValue(failure);

    await expect(withFreshAccessToken(expiredThenOk())).rejects.toBe(failure);

    expect(secureStore.has(REFRESH_TOKEN_KEY)).toBe(false);
    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().accessToken).toBeUndefined();
    expect(logout).not.toHaveBeenCalled();
  });

  it("conserve la session quand l'appel rejoué échoue après un rafraîchissement réussi", async () => {
    vi.mocked(refreshTokenPair).mockResolvedValue(NEW_TOKENS);
    const failure = new TypeError('Network request failed');
    const call = (accessToken: string): Promise<never> =>
      Promise.reject(accessToken === 'access-1' ? apiError(ErrorCode.AUTH_TOKEN_INVALID) : failure);

    await expect(withFreshAccessToken(call)).rejects.toBe(failure);

    expect(secureStore.get(REFRESH_TOKEN_KEY)).toBe('refresh-2');
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(logout).not.toHaveBeenCalled();
  });

  it('ne lance qu’un rafraîchissement pour des appels concurrents', async () => {
    vi.mocked(refreshTokenPair).mockResolvedValue(NEW_TOKENS);

    const results = await Promise.all([
      withFreshAccessToken(expiredThenOk()),
      withFreshAccessToken(expiredThenOk()),
    ]);

    expect(results).toEqual(['ok:access-2', 'ok:access-2']);
    expect(refreshTokenPair).toHaveBeenCalledTimes(1);
  });
});

describe('hydrate', () => {
  const me = { username: 'pilote', email: 'pilote@example.test', provider: 'google' } as UserDto;

  beforeEach(() => {
    useAuthStore.setState({
      status: 'checking',
      accessToken: undefined,
      username: undefined,
      email: undefined,
      provider: undefined,
    });
  });

  it('restaure la session à partir du refresh token stocké', async () => {
    vi.mocked(refreshTokenPair).mockResolvedValue(NEW_TOKENS);
    vi.mocked(getMe).mockResolvedValue(me);

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().accessToken).toBe('access-2');
    expect(secureStore.get(REFRESH_TOKEN_KEY)).toBe('refresh-2');
  });

  it("conserve le refresh token quand l'API est injoignable au démarrage", async () => {
    vi.mocked(refreshTokenPair).mockRejectedValue(new TypeError('Network request failed'));

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(secureStore.get(REFRESH_TOKEN_KEY)).toBe('refresh-1');
  });

  it('conserve le nouveau refresh token quand le profil ne peut pas être chargé', async () => {
    vi.mocked(refreshTokenPair).mockResolvedValue(NEW_TOKENS);
    vi.mocked(getMe).mockRejectedValue(apiError(ErrorCode.INTERNAL_ERROR));

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().accessToken).toBeUndefined();
    expect(secureStore.get(REFRESH_TOKEN_KEY)).toBe('refresh-2');
  });

  it('efface le refresh token quand le serveur le refuse', async () => {
    vi.mocked(refreshTokenPair).mockRejectedValue(apiError(ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED));

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(secureStore.has(REFRESH_TOKEN_KEY)).toBe(false);
  });
});
