// Vocabulaire partagé API ↔ mobile. Le mobile doit pouvoir distinguer les
// cas d'erreur (ex. token expiré → déconnecter, refresh token réutilisé →
// déconnecter partout) sans avoir à parser le texte du message, qui reste
// un texte de debug/repli, pas un contrat.
export const ErrorCode = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USERNAME_ALREADY_TAKEN: 'USERNAME_ALREADY_TAKEN',
  USERNAME_NOT_ALLOWED: 'USERNAME_NOT_ALLOWED',
  USERNAME_CHANGE_TOO_SOON: 'USERNAME_CHANGE_TOO_SOON',
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_OAUTH_TOKEN_INVALID: 'AUTH_OAUTH_TOKEN_INVALID',
  AUTH_REFRESH_TOKEN_INVALID: 'AUTH_REFRESH_TOKEN_INVALID',
  AUTH_REFRESH_TOKEN_REUSED: 'AUTH_REFRESH_TOKEN_REUSED',
  AUTH_REFRESH_TOKEN_EXPIRED: 'AUTH_REFRESH_TOKEN_EXPIRED',
  AUTH_PROVIDER_NOT_CONFIGURED: 'AUTH_PROVIDER_NOT_CONFIGURED',
  SEARCH_PROVIDER_UNAVAILABLE: 'SEARCH_PROVIDER_UNAVAILABLE',
  ROUTING_PROVIDER_UNAVAILABLE: 'ROUTING_PROVIDER_UNAVAILABLE',
  // Génération d'itinéraire par IA : service non configuré ou injoignable.
  AI_ROUTE_UNAVAILABLE: 'AI_ROUTE_UNAVAILABLE',
  // Plus de génération possible aujourd'hui pour cet utilisateur.
  AI_ROUTE_QUOTA_EXCEEDED: 'AI_ROUTE_QUOTA_EXCEEDED',
  // Aucun itinéraire exploitable n'a pu être construit à partir de la
  // proposition (lieux introuvables, hors de portée…).
  AI_ROUTE_GENERATION_FAILED: 'AI_ROUTE_GENERATION_FAILED',
  // Arrivée imposée hors d'atteinte dans la durée demandée, même en ligne
  // droite : refusé avant tout appel au modèle.
  AI_ROUTE_DESTINATION_TOO_FAR: 'AI_ROUTE_DESTINATION_TOO_FAR',
  // Aucun chemin routier entre deux points (moteur de routage) — distinct de
  // SAVED_ROUTE_NOT_FOUND ci-dessous (un itinéraire sauvegardé introuvable).
  ROUTE_NOT_FOUND: 'ROUTE_NOT_FOUND',
  SAVED_ROUTE_NOT_FOUND: 'SAVED_ROUTE_NOT_FOUND',
  RIDE_NOT_FOUND: 'RIDE_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESPONSE_CONTRACT_VIOLATION: 'RESPONSE_CONTRACT_VIOLATION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
