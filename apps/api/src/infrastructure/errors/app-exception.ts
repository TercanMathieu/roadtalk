import { HttpException } from '@nestjs/common';
import type { ErrorCode } from '@roadtalk/contracts';

import { ERROR_CATALOG } from './error-catalog';

export interface AppErrorBody {
  readonly code: ErrorCode;
  readonly message: string;
  readonly details?: unknown;
}

// L'exception unique pour tout le code applicatif — un throw ne fournit
// qu'un code (+ éventuellement un message précis et des détails), jamais un
// texte inventé sur place. Le statut HTTP et le message par défaut viennent
// du catalogue, pas de l'appelant.
export class AppException extends HttpException {
  constructor(code: ErrorCode, message?: string, details?: unknown) {
    const definition = ERROR_CATALOG[code];
    const body: AppErrorBody = {
      code,
      message: message ?? definition.message,
      ...(details !== undefined ? { details } : {}),
    };

    super(body, definition.status);
  }
}
