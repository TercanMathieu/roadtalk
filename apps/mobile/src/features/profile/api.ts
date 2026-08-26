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
