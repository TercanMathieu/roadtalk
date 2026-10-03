import { ErrorCode } from '@roadtalk/contracts';

import { API_BASE_URL } from './apiUrl';

interface ApiErrorBody {
  readonly code: ErrorCode;
  readonly message: string;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'code' in value && 'message' in value;
}

// Le mobile branche sa logique sur `code` (stable), jamais sur `message`
// (texte FR affichable mais pas garanti stable) — même règle que documentée
// côté API pour AppException.
export class ApiError extends Error {
  readonly code: ErrorCode;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.code = body.code;
  }
}

interface RequestOptions {
  readonly accessToken?: string;
  readonly body?: unknown;
}

export async function request(method: string, path: string, options?: RequestOptions): Promise<unknown> {
  if (API_BASE_URL === undefined) {
    // Message explicite plutôt qu'une URL vide qui partirait dans le vide et
    // ressortirait en « Network request failed », symptôme illisible.
    throw new Error(
      "Adresse de l'API introuvable : ni EXPO_PUBLIC_API_URL, ni hôte Metro disponible.",
    );
  }

  // Seulement avec un corps : Fastify refuse un POST annoncé en JSON mais
  // vide (FST_ERR_CTP_EMPTY_JSON_BODY), ex. accepter une demande d'ami.
  const headers: Record<string, string> =
    options?.body !== undefined ? { 'Content-Type': 'application/json' } : {};
  if (options?.accessToken !== undefined) {
    headers['Authorization'] = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    ...(options?.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  });

  const json: unknown = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    if (isApiErrorBody(json)) {
      throw new ApiError(json);
    }
    throw new Error(`Requête ${path} échouée (${response.status.toString()})`);
  }

  return json;
}
