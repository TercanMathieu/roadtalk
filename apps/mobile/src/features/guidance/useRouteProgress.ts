import type { RouteGeometryDto } from '@roadtalk/contracts';
import { useMemo } from 'react';

import {
  buildRouteProgressModel,
  computeRouteProgress,
  getManeuverSteps,
  type ManeuverStep,
  type RouteProgress,
} from './route-progress';

// Latitude/longitude en primitives plutôt qu'un objet {latitude, longitude} :
// un objet reconstruit à chaque rendu par l'appelant casserait la
// mémoïsation ci-dessous (nouvelle référence à chaque fois même si les
// valeurs n'ont pas changé), des primitives se comparent par valeur.
//
// Séparé du calcul lui-même (route-progress.ts, pur et testé isolément) :
// ce hook n'ajoute que la mémoïsation React — reconstruire le modèle
// (distances cumulées le long du trajet) seulement quand le trajet change,
// pas à chaque mise à jour de position GPS.
export function useRouteProgress(
  route: RouteGeometryDto | undefined,
  latitude: number | undefined,
  longitude: number | undefined,
): RouteProgress | undefined {
  const model = useMemo(() => (route !== undefined ? buildRouteProgressModel(route) : undefined), [route]);

  return useMemo(() => {
    if (model === undefined || latitude === undefined || longitude === undefined) {
      return undefined;
    }

    return computeRouteProgress(model, { latitude, longitude });
  }, [model, latitude, longitude]);
}

// Récapitulatif complet des manœuvres (panneau "étapes"), indépendant de la
// position live — recalculé seulement quand le trajet change.
export function useManeuverSteps(route: RouteGeometryDto | undefined): readonly ManeuverStep[] {
  return useMemo(() => {
    if (route === undefined) {
      return [];
    }
    return getManeuverSteps(buildRouteProgressModel(route));
  }, [route]);
}
