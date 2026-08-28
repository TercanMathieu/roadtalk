import { Injectable } from '@nestjs/common';
import { ErrorCode } from '@roadtalk/contracts';

import { env } from '../../infrastructure/config/env';
import { AppException } from '../../infrastructure/errors/app-exception';
import { type OAuthTokenClaims,OidcTokenVerifier } from './oauth-token-verifier';

const GOOGLE_ISSUER = 'https://accounts.google.com';
const GOOGLE_JWKS_URI = 'https://www.googleapis.com/oauth2/v3/certs';
const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_JWKS_URI = 'https://appleid.apple.com/auth/keys';

@Injectable()
export class GoogleTokenVerifier {
  private readonly verifier =
    env.GOOGLE_OAUTH_CLIENT_ID !== undefined
      ? new OidcTokenVerifier({
          issuer: GOOGLE_ISSUER,
          audience: env.GOOGLE_OAUTH_CLIENT_ID,
          jwksUri: GOOGLE_JWKS_URI,
        })
      : undefined;

  async verify(idToken: string): Promise<OAuthTokenClaims> {
    if (!this.verifier) {
      throw new AppException(ErrorCode.AUTH_PROVIDER_NOT_CONFIGURED, 'GOOGLE_OAUTH_CLIENT_ID non configuré');
    }

    return this.verifier.verify(idToken);
  }
}



@Injectable()
export class AppleTokenVerifier {
  private readonly verifier =
    env.APPLE_CLIENT_ID !== undefined
      ? new OidcTokenVerifier({
          issuer: APPLE_ISSUER,
          audience: env.APPLE_CLIENT_ID,
          jwksUri: APPLE_JWKS_URI,
        })
      : undefined;

  async verify(idToken: string): Promise<OAuthTokenClaims> {
    if (!this.verifier) {
      throw new AppException(ErrorCode.AUTH_PROVIDER_NOT_CONFIGURED, 'APPLE_CLIENT_ID non configuré');
    }

    return this.verifier.verify(idToken);
  }
}