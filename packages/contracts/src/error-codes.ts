// Vocabulaire partagé API ↔ mobile. Le mobile doit pouvoir distinguer les
// cas d'erreur (ex. token expiré → déconnecter, refresh token réutilisé →
// déconnecter partout) sans avoir à parser le texte du message, qui reste
// un texte de debug/repli, pas un contrat.
export const ErrorCode = {
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USERNAME_ALREADY_TAKEN: 'USERNAME_ALREADY_TAKEN',
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_OAUTH_TOKEN_INVALID: 'AUTH_OAUTH_TOKEN_INVALID',
  AUTH_REFRESH_TOKEN_INVALID: 'AUTH_REFRESH_TOKEN_INVALID',
  AUTH_REFRESH_TOKEN_REUSED: 'AUTH_REFRESH_TOKEN_REUSED',
  AUTH_REFRESH_TOKEN_EXPIRED: 'AUTH_REFRESH_TOKEN_EXPIRED',
  AUTH_PROVIDER_NOT_CONFIGURED: 'AUTH_PROVIDER_NOT_CONFIGURED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESPONSE_CONTRACT_VIOLATION: 'RESPONSE_CONTRACT_VIOLATION',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
