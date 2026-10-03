import { z } from 'zod';

import { TAG_LENGTH, USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH } from './user.contract';

// Amis (ADR-005) : on ajoute quelqu'un par son identifiant complet
// « Pseudo#TAG » — aucun annuaire, impossible de parcourir les comptes.

// Saisi par le motard : la casse est libre, le pseudo se compare sans elle et
// le tag en majuscules (ADR-003).
export const friendHandleSchema = z
  .string()
  .trim()
  .regex(
    new RegExp(
      `^[A-Za-z0-9_]{${String(USERNAME_MIN_LENGTH)},${String(USERNAME_MAX_LENGTH)}}#[A-Za-z]{${String(TAG_LENGTH)}}$`,
    ),
    'Identifiant attendu au format Pseudo#TAG',
  );

export const sendFriendRequestSchema = z.object({ handle: friendHandleSchema }).strict();

export type SendFriendRequestDto = z.infer<typeof sendFriendRequestSchema>;

export const blockUserSchema = z.object({ userId: z.string().uuid() }).strict();

export type BlockUserDto = z.infer<typeof blockUserSchema>;

// Ce qu'un motard voit d'un autre : son identifiant public, rien de plus —
// jamais son e-mail ni son nom (C4). Pseudo et tag sont nuls quand la
// modération a retiré l'identifiant, le temps qu'il en choisisse un autre.
export const publicUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string().nullable(),
  tag: z.string().nullable(),
});

export type PublicUserDto = z.infer<typeof publicUserSchema>;

export const friendSchema = z.object({
  user: publicUserSchema,
  // Date à laquelle la demande a été acceptée (ms depuis l'epoch).
  since: z.number().int().nonnegative(),
});

export type FriendDto = z.infer<typeof friendSchema>;

export const friendRequestSchema = z.object({
  id: z.string().uuid(),
  // L'autre motard : l'expéditeur pour une demande reçue, le destinataire
  // pour une demande envoyée.
  user: publicUserSchema,
  sentAt: z.number().int().nonnegative(),
});

export type FriendRequestDto = z.infer<typeof friendRequestSchema>;

// Tout l'état des amis de l'appelant, renvoyé par chaque route : le mobile
// remplace simplement son état par la réponse.
export const friendsOverviewSchema = z.object({
  friends: z.array(friendSchema),
  incoming: z.array(friendRequestSchema),
  outgoing: z.array(friendRequestSchema),
  blocked: z.array(publicUserSchema),
});

export type FriendsOverviewDto = z.infer<typeof friendsOverviewSchema>;
