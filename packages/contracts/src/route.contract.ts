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
  createdAt: z.number().int().nonnegative(),
});

export type GeoPointDto = z.infer<typeof geoPointSchema>;
export type RouteDto = z.infer<typeof routeSchema>;
