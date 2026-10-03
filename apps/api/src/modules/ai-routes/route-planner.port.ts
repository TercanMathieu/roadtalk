// Port vers le modèle d'IA qui propose une balade (ADR-004) : le service n'en
// connaît que cette interface, ce qui permet de le tester sans appel payant.

// Un lieu tel que le modèle le nomme — jamais des coordonnées : c'est le
// géocodeur qui le retrouve sur la carte.
export interface PlannedWaypoint {
  readonly name: string;
  // Département ou région, pour lever les homonymies ("Saint-Martin").
  readonly region: string;
  readonly note: string;
}

export interface RoutePlan {
  readonly title: string;
  readonly summary: string;
  readonly waypoints: readonly PlannedWaypoint[];
}

export interface PlannerUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface PlannerResult {
  // undefined : réponse inexploitable (refus, réponse tronquée ou mal
  // formée). L'appel a quand même eu lieu et coûté, d'où `usage`.
  readonly plan: RoutePlan | undefined;
  readonly usage: PlannerUsage;
}

export const ROUTE_PLANNER = Symbol('ROUTE_PLANNER');

export interface RoutePlanner {
  // Lève AppException(AI_ROUTE_UNAVAILABLE) si le service est injoignable ou
  // non configuré — aucun appel facturé dans ce cas.
  plan(brief: string): Promise<PlannerResult>;
}
