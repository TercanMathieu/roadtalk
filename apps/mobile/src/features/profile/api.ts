import { type HandleSuggestionDto, handleSuggestionSchema, type UserDto, userSchema } from '@roadtalk/contracts';

import { request } from '../../lib/http';

export async function getMe(accessToken: string): Promise<UserDto> {
  const json = await request('GET', '/users/me', { accessToken });
  return userSchema.parse(json);
}

// Demande au serveur si ce pseudo est acceptable et, si oui, un tag libre
// pour lui. Rejette avec USERNAME_NOT_ALLOWED si le filtre le refuse.
export async function getHandleSuggestion(accessToken: string, username: string): Promise<HandleSuggestionDto> {
  const params = new URLSearchParams({ username });
  const json = await request('GET', `/users/me/handle-suggestion?${params.toString()}`, { accessToken });
  return handleSuggestionSchema.parse(json);
}

// Enregistre l'identifiant "Pseudo#TAG", avec le tag que le serveur vient de
// proposer (getHandleSuggestion).
export async function setHandle(accessToken: string, username: string, tag: string): Promise<UserDto> {
  const json = await request('PATCH', '/users/me/username', { accessToken, body: { username, tag } });
  return userSchema.parse(json);
}

// Droit à l'oubli (Art. 17 RGPD, C4) : suppression définitive côté serveur —
// le compte n'existe plus après cet appel, jamais une simple désactivation.
export async function deleteMe(accessToken: string): Promise<void> {
  await request('DELETE', '/users/me', { accessToken });
}
