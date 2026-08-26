import { type CanActivate, type ExecutionContext,Injectable } from '@nestjs/common';
import { ErrorCode } from '@roadtalk/contracts';
import type { UserId } from '@roadtalk/domain-shared';
import type { FastifyRequest } from 'fastify';

import { AppException } from '../errors/app-exception';
import { AccessTokenService } from './access-token.service';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: UserId;
  }
}

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly accessTokenService: AccessTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const authHeader = request.headers.authorization;

    if (typeof authHeader !== 'string' || !authHeader.startsWith(BEARER_PREFIX)) {
      throw new AppException(ErrorCode.AUTH_TOKEN_MISSING);
    }

    const token = authHeader.slice(BEARER_PREFIX.length);

    try {
      request.userId = await this.accessTokenService.verify(token);
    } catch {
      throw new AppException(ErrorCode.AUTH_TOKEN_INVALID);
    }

    return true;
  }
}
