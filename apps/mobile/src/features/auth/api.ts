import { type TokenPairDto, tokenPairSchema } from '@roadtalk/contracts';

import { request } from '../../lib/http';

export async function loginWithGoogle(idToken: string): Promise<TokenPairDto> {
  const json = await request('POST', '/auth/google', { body: { idToken } });
  return tokenPairSchema.parse(json);
}

export async function refreshTokenPair(refreshToken: string): Promise<TokenPairDto> {
  const json = await request('POST', '/auth/refresh', { body: { refreshToken } });
  return tokenPairSchema.parse(json);
}

export async function logout(refreshToken: string): Promise<void> {
  await request('POST', '/auth/logout', { body: { refreshToken } });
}
