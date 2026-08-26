import { type ArgumentsHost, Catch, type ExceptionFilter,HttpException, Logger } from '@nestjs/common';
import { ErrorCode } from '@roadtalk/contracts';
import type { FastifyReply } from 'fastify';

import type { AppErrorBody } from './app-exception';
import { ERROR_CATALOG } from './error-catalog';

function isAppErrorBody(value: unknown): value is AppErrorBody {
  return typeof value === 'object' && value !== null && 'code' in value && 'message' in value;
}

// Filet de sécurité : garantit que TOUTE réponse d'erreur a un `code`, même
// une exception NestJS/Fastify interne (route inconnue, etc.) ou un bug
// totalement non anticipé — jamais un message brut sans code exploitable,
// jamais une stack trace exposée au client.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = host.switchToHttp().getResponse<FastifyReply>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (isAppErrorBody(response)) {
        void reply.status(status).send({ statusCode: status, ...response });
        return;
      }

      // Exception levée par NestJS/Fastify lui-même (ex. route inconnue),
      // pas via AppException : pas de code métier attaché à l'origine.
      const message = typeof response === 'string' ? response : exception.message;
      void reply.status(status).send({ statusCode: status, code: ErrorCode.INTERNAL_ERROR, message });
      return;
    }

    this.logger.error(exception);
    const { status, message } = ERROR_CATALOG[ErrorCode.INTERNAL_ERROR];
    void reply.status(status).send({ statusCode: status, code: ErrorCode.INTERNAL_ERROR, message });
  }
}
