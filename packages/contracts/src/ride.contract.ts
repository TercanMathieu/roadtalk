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
