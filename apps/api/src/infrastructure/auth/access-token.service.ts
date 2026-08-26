import { Injectable } from '@nestjs/common';
import { toUserId, type UserId } from '@roadtalk/domain-shared';
import { importPKCS8, importSPKI, jwtVerify, SignJWT } from 'jose';

import { env } from '../config/env';

const JWT_ALGORITHM = 'EdDSA';
const JWT_ISSUER = 'roadtalk-api';
// Décision de stack : JWT EdDSA de courte durée + refresh token opaque à côté.
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

@Injectable()
export class AccessTokenService {
  // Les clés PEM ne sont parsées qu'une fois (à la construction du service,
  // singleton NestJS) plutôt qu'à chaque émission/vérification de token.
  private readonly privateKeyPromise = importPKCS8(env.JWT_PRIVATE_KEY, JWT_ALGORITHM);
  private readonly publicKeyPromise = importSPKI(env.JWT_PUBLIC_KEY, JWT_ALGORITHM);

  async issue(userId: UserId): Promise<string> {
    const privateKey = await this.privateKeyPromise;

    return new SignJWT({})
      .setProtectedHeader({ alg: JWT_ALGORITHM })
      .setSubject(userId)
      .setIssuer(JWT_ISSUER)
      .setIssuedAt()
      .setExpirationTime(`${String(ACCESS_TOKEN_TTL_SECONDS)}s`)
      .sign(privateKey);
  }

  async verify(token: string): Promise<UserId> {
    const publicKey = await this.publicKeyPromise;
    const { payload } = await jwtVerify(token, publicKey, { issuer: JWT_ISSUER });

    if (typeof payload.sub !== 'string') {
      throw new Error('JWT sans "sub"');
    }

    return toUserId(payload.sub);
  }
}
