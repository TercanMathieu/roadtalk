import { z } from 'zod';

import { geoPointSchema } from './route.contract';

// Requête de routage à la demande — deux points, pas un itinéraire enregistré
// (voir routeSchema pour ça). C'est le point de départ de "mettre le chemin
// sur la map" : origine et destination suffisent pour V1, les étapes
// intermédiaires viendront avec la création d'itinéraire complète.
export const routingQuerySchema = z.object({
  origin: geoPointSchema,
  destination: geoPointSchema,
});

export type RoutingQueryDto = z.infer<typeof routingQuerySchema>;

export const routeGeometrySchema = z.object({
  distanceMeters: z.number().nonnegative(),
  durationSeconds: z.number().nonnegative(),
  // Séquence ordonnée de points suivant les routes réelles (moteur de
  // routage), pas une ligne droite entre origine et destination.
  path: z.array(geoPointSchema).min(2),
});

export type RouteGeometryDto = z.infer<typeof routeGeometrySchema>;
