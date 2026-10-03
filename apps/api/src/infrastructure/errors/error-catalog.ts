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
  [ErrorCode.USERNAME_NOT_ALLOWED]: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    message: "Ce pseudo n'est pas autorisé",
  },
  [ErrorCode.USERNAME_CHANGE_TOO_SOON]: {
    status: HttpStatus.CONFLICT,
    message: 'Le pseudo ne peut être modifié que tous les 3 mois',
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
  [ErrorCode.SEARCH_PROVIDER_UNAVAILABLE]: {
    // 502 et non 503 : c'est la réponse d'un service en amont qui est en
    // cause, pas notre propre disponibilité.
    status: HttpStatus.BAD_GATEWAY,
    message: 'Service de recherche d\'adresse momentanément indisponible',
  },
  [ErrorCode.AI_ROUTE_UNAVAILABLE]: {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: "Génération d'itinéraire momentanément indisponible",
  },
  [ErrorCode.AI_ROUTE_QUOTA_EXCEEDED]: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: "Nombre maximal de générations atteint pour aujourd'hui",
  },
  [ErrorCode.AI_ROUTE_GENERATION_FAILED]: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    message: "Impossible de construire un itinéraire avec ces critères",
  },
  [ErrorCode.AI_ROUTE_DESTINATION_TOO_FAR]: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    message: 'Arrivée trop éloignée pour la durée choisie',
  },
  [ErrorCode.FRIEND_HANDLE_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: 'Aucun motard avec cet identifiant',
  },
  [ErrorCode.FRIEND_REQUEST_INVALID]: {
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    message: "Demande d'ami impossible",
  },
  [ErrorCode.FRIEND_ALREADY_CONNECTED]: {
    status: HttpStatus.CONFLICT,
    message: 'Vous êtes déjà amis, ou une demande est en cours',
  },
  [ErrorCode.FRIEND_REQUEST_LIMIT]: {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: "Trop de demandes d'amis envoyées aujourd'hui",
  },
  [ErrorCode.FRIEND_REQUEST_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: 'Demande ou ami introuvable',
  },
  [ErrorCode.ROUTING_PROVIDER_UNAVAILABLE]: {
    status: HttpStatus.BAD_GATEWAY,
    message: 'Service de calcul d\'itinéraire momentanément indisponible',
  },
  [ErrorCode.ROUTE_NOT_FOUND]: {
    // 422 et non 502/404 : la requête est valide, le service a répondu, mais
    // aucun chemin routier n'existe entre les deux points (ex. destination
    // isolée). Distinct d'une panne du moteur de routage.
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    message: 'Aucun itinéraire trouvé entre ces deux points',
  },
  [ErrorCode.RIDE_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: 'Balade introuvable',
  },
  [ErrorCode.SAVED_ROUTE_NOT_FOUND]: {
    status: HttpStatus.NOT_FOUND,
    message: 'Itinéraire introuvable',
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
