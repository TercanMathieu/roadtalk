import { type FriendsOverviewDto, friendsOverviewSchema } from '@roadtalk/contracts';

import { request } from '../../lib/http';

// Chaque route renvoie l'état complet des amis : voir FriendsController.
async function call(
  accessToken: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<FriendsOverviewDto> {
  const json = await request(method, path, {
    accessToken,
    ...(body !== undefined ? { body } : {}),
  });
  return friendsOverviewSchema.parse(json);
}

export function getFriends(accessToken: string): Promise<FriendsOverviewDto> {
  return call(accessToken, 'GET', '/friends');
}

export function sendFriendRequest(
  accessToken: string,
  handle: string,
): Promise<FriendsOverviewDto> {
  return call(accessToken, 'POST', '/friends/requests', { handle });
}

export function acceptFriendRequest(
  accessToken: string,
  requestId: string,
): Promise<FriendsOverviewDto> {
  return call(accessToken, 'POST', `/friends/requests/${requestId}/accept`);
}

// Refuser une demande reçue ou annuler une demande envoyée.
export function removeFriendRequest(
  accessToken: string,
  requestId: string,
): Promise<FriendsOverviewDto> {
  return call(accessToken, 'DELETE', `/friends/requests/${requestId}`);
}

export function removeFriend(accessToken: string, userId: string): Promise<FriendsOverviewDto> {
  return call(accessToken, 'DELETE', `/friends/${userId}`);
}

export function blockUser(accessToken: string, userId: string): Promise<FriendsOverviewDto> {
  return call(accessToken, 'POST', '/friends/blocks', { userId });
}

export function unblockUser(accessToken: string, userId: string): Promise<FriendsOverviewDto> {
  return call(accessToken, 'DELETE', `/friends/blocks/${userId}`);
}
