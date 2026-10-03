import { z } from 'zod';

import { geoPointSchema } from './route.contract';
import { routeGeometrySchema } from './routing.contract';

// Génération d'itinéraire par IA (ADR-004) : l'utilisateur décrit la balade
// qu'il veut, le serveur renvoie un itinéraire réel (lieux existants, trajet
// calculé par le moteur de routage), jamais un tracé inventé par le modèle.

export const aiTripTypeSchema = z.enum(['loop', 'one-way']);
export const aiSinuositySchema = z.enum(['direct', 'moderate', 'winding', 'hairpins']);
export const aiRoadPreferenceSchema = z.enum(['avoidHighways', 'goodSurface', 'scenic']);
export const aiStopKindSchema = z.enum(['passes', 'coffee', 'viewpoint']);

export const AI_ROUTE_MIN_DURATION_MINUTES = 30;
export const AI_ROUTE_MAX_DURATION_MINUTES = 600;
export const AI_ROUTE_NOTES_MAX_LENGTH = 300;

export const generateAiRouteRequestSchema = z
  .object({
    // Point de départ : la position du motard ou un lieu qu'il a choisi.
    // Reste sur le serveur : seule la commune est transmise au modèle d'IA,
    // jamais les coordonnées (C4). Même règle pour `destination`.
    origin: geoPointSchema,
    tripType: aiTripTypeSchema,
    // Arrivée imposée, pour un aller simple seulement. Absente : le modèle
    // choisit lui-même où la balade se termine.
    destination: geoPointSchema.optional(),
    durationMinutes: z
      .number()
      .int()
      .min(AI_ROUTE_MIN_DURATION_MINUTES)
      .max(AI_ROUTE_MAX_DURATION_MINUTES),
    sinuosity: aiSinuositySchema,
    roadPreferences: z.array(aiRoadPreferenceSchema).max(3),
    stopKinds: z.array(aiStopKindSchema).max(3),
    notes: z.string().trim().max(AI_ROUTE_NOTES_MAX_LENGTH).optional(),
  })
  .strict()
  .refine((request) => request.destination === undefined || request.tripType === 'one-way', {
    message: 'Une arrivée ne se choisit que pour un aller simple',
    path: ['destination'],
  });

export type GenerateAiRouteRequestDto = z.infer<typeof generateAiRouteRequestSchema>;

export const aiRouteWaypointSchema = z.object({
  label: z.string().min(1),
  context: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  // Pourquoi ce point : courte phrase rédigée par le modèle.
  note: z.string(),
});

export type AiRouteWaypointDto = z.infer<typeof aiRouteWaypointSchema>;

// Où se termine l'itinéraire, après le dernier point de `waypoints` :
// - start : boucle, retour au point de départ ;
// - destination : arrivée imposée dans la demande ;
// - last-waypoint : aller simple, le dernier point proposé est l'arrivée.
export const aiRouteEndingSchema = z.enum(['start', 'destination', 'last-waypoint']);

export type AiRouteEnding = z.infer<typeof aiRouteEndingSchema>;

export const aiRouteSchema = z.object({
  title: z.string().min(1),
  summary: z.string(),
  // Points de passage dans l'ordre, sans le départ, et sans l'arrivée
  // quand elle est le départ ou l'arrivée imposée (voir `ending`).
  waypoints: z.array(aiRouteWaypointSchema).min(1),
  ending: aiRouteEndingSchema,
  avoidHighways: z.boolean(),
  geometry: routeGeometrySchema,
  // Générations encore possibles aujourd'hui pour cet utilisateur.
  remainingToday: z.number().int().nonnegative(),
});

export type AiRouteDto = z.infer<typeof aiRouteSchema>;
