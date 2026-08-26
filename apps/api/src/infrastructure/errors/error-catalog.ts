import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@roadtalk/contracts';

interface ErrorDefinition {
  readonly status: HttpStatus;
  readonly message: string;
}

// Un seul endroit pour tous les messages d'erreur envoyés au client — le
// `Record<ErrorCode, ...>` force le compilateur à signaler tout code défini
// dans @roadtalk/contracts qui n'aurait pas encore son entrée ici.
export const ERROR_CATALOG: Record<ErrorCode, ErrorDefinition> = {
  [ErrorCode.USER_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: 'Utilisateur introuvable',
  },
  [ErrorCode.USERNAME_ALREADY_TAKEN]: {
    status: HttpStatus.CONFLICT,
    message: 'Ce pseudo est déjà pris',
  },
  [ErrorCode.AUTH_TOKEN_MISSING]: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'En-tête Authorization manquant ou mal formé',
  },
  [ErrorCode.AUTH_TOKEN_INVALID]: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Token invalide ou expiré',
  },
  [ErrorCode.AUTH_OAUTH_TOKEN_INVALID]: {
    status: HttpStatus.UNAUTHORIZED,
    message: "Token du fournisseur d'identité invalide",
  },
  [ErrorCode.AUTH_REFRESH_TOKEN_INVALID]: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Refresh token invalide',
  },
  [ErrorCode.AUTH_REFRESH_TOKEN_REUSED]: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Refresh token déjà utilisé',
  },
  [ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED]: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Refresh token expiré',
  },
  [ErrorCode.AUTH_PROVIDER_NOT_CONFIGURED]: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: "Fournisseur d'authentification non configuré",
  },
  [ErrorCode.VALIDATION_ERROR]: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Requête invalide',
  },
  [ErrorCode.RESPONSE_CONTRACT_VIOLATION]: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Réponse non conforme au contrat attendu',
  },
  [ErrorCode.INTERNAL_ERROR]: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Erreur interne',
  },
};
