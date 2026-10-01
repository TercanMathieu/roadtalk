import { type UserDto, userSchema } from '@roadtalk/contracts';

import { request } from '../../lib/http';

export async function getMe(accessToken: string): Promise<UserDto> {
  const json = await request('GET', '/users/me', { accessToken });
  return userSchema.parse(json);
}

export async function setUsername(accessToken: string, username: string): Promise<UserDto> {
  const json = await request('PATCH', '/users/me/username', { accessToken, body: { username } });
  return userSchema.parse(json);
}

// Droit à l'oubli (Art. 17 RGPD, C4) : suppression définitive côté serveur —
// le compte n'existe plus après cet appel, jamais une simple désactivation.
export async function deleteMe(accessToken: string): Promise<void> {
  await request('DELETE', '/users/me', { accessToken });
}
