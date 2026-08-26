import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { ErrorCode } from '@roadtalk/contracts';
import { lastValueFrom, of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { type AppErrorBody,AppException } from '../../../src/infrastructure/errors/app-exception';
import { ZodResponseInterceptor } from '../../../src/infrastructure/http/zod-response.interceptor';

const schema = z.object({ id: z.string().uuid(), name: z.string() });

function handlerReturning(payload: unknown): CallHandler {
  return { handle: () => of(payload) };
}

describe('ZodResponseInterceptor', () => {
  it('laisse passer une réponse conforme au contrat', async () => {
    const interceptor = new ZodResponseInterceptor(schema);
    const payload = { id: '3fa85f64-5717-4562-b3fc-2c963f66afa6', name: 'Marie' };

    const result = await lastValueFrom(
      interceptor.intercept({} as ExecutionContext, handlerReturning(payload)),
    );

    expect(result).toEqual(payload);
  });

  it('rejette une réponse qui ne correspond pas au contrat, avec le bon code', async () => {
    const interceptor = new ZodResponseInterceptor(schema);
    const invalidPayload = { id: 'pas-un-uuid', name: 'Marie' };

    try {
      await lastValueFrom(interceptor.intercept({} as ExecutionContext, handlerReturning(invalidPayload)));
      expect.unreachable('devait rejeter');
    } catch (error) {
      expect(error).toBeInstanceOf(AppException);
      const appError = error as AppException;
      const body = appError.getResponse() as AppErrorBody;
      expect(body.code).toBe(ErrorCode.RESPONSE_CONTRACT_VIOLATION);
      expect(appError.getStatus()).toBe(500);
    }
  });
});
