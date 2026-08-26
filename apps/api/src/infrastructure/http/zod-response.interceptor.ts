import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { ErrorCode } from '@roadtalk/contracts';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { ZodType } from 'zod';

import { AppException } from '../errors/app-exception';

/**
 * Valide la réponse d'une route contre son contrat Zod avant de l'envoyer.
 * Une non-conformité est un bug côté serveur (le contrat a été violé par
 * notre propre code), donc 500 — pas 400 comme pour une entrée invalide.
 */
@Injectable()
export class ZodResponseInterceptor<T> implements NestInterceptor<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  intercept(_context: ExecutionContext, next: CallHandler<unknown>): Observable<T> {
    return next.handle().pipe(
      map((payload) => {
        const result = this.schema.safeParse(payload);

        if (!result.success) {
          throw new AppException(ErrorCode.RESPONSE_CONTRACT_VIOLATION, undefined, result.error.flatten());
        }

        return result.data;
      }),
    );
  }
}
