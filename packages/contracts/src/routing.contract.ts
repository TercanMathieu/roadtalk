import { z } from 'zod';

import { geoPointSchema } from './route.contract';

// Requête de routage à la demande — pas un itinéraire enregistré (voir
// routeSchema pour ça). Séquence ordonnée : le premier point est l'origine
// (la position de l'utilisateur), chaque point suivant un arrêt à visiter
// dans cet ordre — au minimum origine + une destination.
export const routingQuerySchema = z.object({
  waypoints: z.array(geoPointSchema).min(2),
  // Absent = comportement par défaut du moteur de routage (autoroutes
  // autorisées). Optionnel plutôt que `boolean` avec valeur par défaut : la
  // sémantique "non précisé" doit rester distincte de "false" côté serveur.
  avoidHighways: z.boolean().optional(),
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
