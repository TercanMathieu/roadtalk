import { z } from 'zod';

export const rideStatusSchema = z.enum(['planned', 'active', 'completed', 'cancelled']);

export const rideSummarySchema = z.object({
  distanceMeters: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  averageSpeedMps: z.number().nonnegative(),
  maxSpeedMps: z.number().nonnegative(),
  elevationGainMeters: z.number().nonnegative(),
});

export const rideSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  routeId: z.string().uuid().optional(),
  participantIds: z.array(z.string().uuid()).min(1),
  status: rideStatusSchema,
  startedAt: z.number().int().nonnegative().optional(),
  endedAt: z.number().int().nonnegative().optional(),
  summary: rideSummarySchema.optional(),
});

export type RideDto = z.infer<typeof rideSchema>;
export type RideSummaryDto = z.infer<typeof rideSummarySchema>;

// Un relevé du tracé GPS — même forme que `TrackPoint` dans les domaines
// mobile et API (ADR-001 : pas partagé via domain-shared, ce module reste
// local au contexte Ride ; seule la forme du contrat l'est, ici).
export const trackPointSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  recordedAt: z.number().int().nonnegative(),
  speedMps: z.number().nonnegative().optional(),
  altitudeMeters: z.number().optional(),
  accuracyMeters: z.number().nonnegative(),
});

export type TrackPointDto = z.infer<typeof trackPointSchema>;

// Requête de sauvegarde d'une balade terminée : le client envoie le tracé
// brut, jamais un résumé déjà calculé — le serveur recalcule lui-même le
// résumé (summarizeTrack) plutôt que de faire confiance à une valeur qu'il
// n'a pas vérifiée.
export const saveRideRequestSchema = z.object({
  // Identifiant choisi par le client au démarrage de la balade : un envoi
  // rejoué (réponse perdue, nouvel essai) ne crée pas de doublon. Absent, le
  // serveur en choisit un.
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  startedAt: z.number().int().nonnegative(),
  endedAt: z.number().int().nonnegative(),
  track: z.array(trackPointSchema),
});

export type SaveRideRequestDto = z.infer<typeof saveRideRequestSchema>;

export const rideListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  startedAt: z.number().int().nonnegative(),
  endedAt: z.number().int().nonnegative(),
  summary: rideSummarySchema,
  isFavorite: z.boolean(),
});

export type RideListItemDto = z.infer<typeof rideListItemSchema>;

export const rideListSchema = z.array(rideListItemSchema);

export const rideDetailSchema = rideListItemSchema.extend({
  track: z.array(trackPointSchema),
});

export type RideDetailDto = z.infer<typeof rideDetailSchema>;

export const setRideFavoriteRequestSchema = z.object({
  isFavorite: z.boolean(),
});

export type SetRideFavoriteRequestDto = z.infer<typeof setRideFavoriteRequestSchema>;

export const renameRideRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export type RenameRideRequestDto = z.infer<typeof renameRideRequestSchema>;
