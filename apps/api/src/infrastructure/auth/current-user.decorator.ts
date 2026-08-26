import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { UserId } from '@roadtalk/domain-shared';
import type { FastifyRequest } from 'fastify';

// N'a de sens que sur une route protégée par JwtAuthGuard, qui remplit
// request.userId. L'utiliser ailleurs est une erreur de programmation,
// pas un cas d'exécution à gérer proprement — d'où l'exception brute.
export const CurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): UserId => {
  const request = ctx.switchToHttp().getRequest<FastifyRequest>();

  if (request.userId === undefined) {
    throw new Error('@CurrentUserId() utilisé sur une route sans JwtAuthGuard');
  }

  return request.userId;
});
