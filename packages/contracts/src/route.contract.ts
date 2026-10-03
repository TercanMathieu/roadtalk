import { z } from 'zod';

export const geoPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const routingOptionsSchema = z.object({
  avoidHighways: z.boolean(),
  avoidTolls: z.boolean(),
});

export const routeSourceSchema = z.enum(['planned', 'gpx_import']);

export const routeSchema = z.object({
  id: z.string().uuid(),
  authorId: z.string().uuid(),
  name: z.string().min(1).optional(),
  waypoints: z.array(geoPointSchema).min(2),
  routingOptions: routingOptionsSchema,
  source: routeSourceSchema,
  distanceMeters: z.number().nonnegative().optional(),
  durationSeconds: z.number().nonnegative().optional(),
  elevationGainMeters: z.number().nonnegative().optional(),
  // Mise en avant personnelle, même notion que sur une balade (Ride) :
  // c'est ce drapeau, pas le simple fait d'être enregistré, qui place un
  // itinéraire dans l'onglet Favoris.
  isFavorite: z.boolean(),
  createdAt: z.number().int().nonnegative(),
});

export type GeoPointDto = z.infer<typeof geoPointSchema>;
export type RouteDto = z.infer<typeof routeSchema>;

// Requête de sauvegarde d'un itinéraire planifié (pas encore roulé) — source
// toujours 'planned' pour ce flux (l'import GPX, F6, n'est pas construit).
// distance/durée sont celles que le client vient de recevoir du même moteur
// de routage — voir le commentaire du modèle Prisma pour le raisonnement.
export const saveRouteRequestSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  waypoints: z.array(geoPointSchema).min(2),
  routingOptions: routingOptionsSchema,
  distanceMeters: z.number().nonnegative().optional(),
  durationSeconds: z.number().nonnegative().optional(),
});

export type SaveRouteRequestDto = z.infer<typeof saveRouteRequestSchema>;

export const routeListSchema = z.array(routeSchema);

export const renameRouteRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export type RenameRouteRequestDto = z.infer<typeof renameRouteRequestSchema>;

export const setRouteFavoriteRequestSchema = z.object({
  isFavorite: z.boolean(),
});

export type SetRouteFavoriteRequestDto = z.infer<typeof setRouteFavoriteRequestSchema>;
