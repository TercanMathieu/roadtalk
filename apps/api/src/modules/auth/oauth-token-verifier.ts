import { ErrorCode } from '@roadtalk/contracts';
import { createRemoteJWKSet, type JWTPayload,jwtVerify } from 'jose';

import { AppException } from '../../infrastructure/errors/app-exception';

export interface OAuthTokenClaims {
  readonly subject: string;
  readonly email: string;
  readonly firstName: string | undefined;
  readonly lastName: string | undefined;
}

export interface OidcVerifierConfig {
  readonly issuer: string;
  readonly audience: string;
  readonly jwksUri: string;
}

function readOptionalStringClaim(payload: JWTPayload, key: string): string | undefined {
  const value = payload[key];
  return typeof value === 'string' ? value : undefined;
}

// Un vérificateur par provider (Apple, Google) — chacun garde son propre jeu
// de clés JWKS en cache via createRemoteJWKSet, qui ne doit être appelé
// qu'une fois par issuer (pas à chaque vérification, sinon pas de cache).
export class OidcTokenVerifier {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly config: OidcVerifierConfig) {
    this.jwks = createRemoteJWKSet(new URL(config.jwksUri));
  }

  async verify(idToken: string): Promise<OAuthTokenClaims> {
    const payload = await this.verifySignatureAndClaims(idToken);

    if (typeof payload.sub !== 'string') {
      throw new AppException(ErrorCode.AUTH_OAUTH_TOKEN_INVALID, 'Token OIDC sans "sub"');
    }

    const email = readOptionalStringClaim(payload, 'email');
    if (email === undefined) {
      throw new AppException(ErrorCode.AUTH_OAUTH_TOKEN_INVALID, 'Token OIDC sans "email"');
    }

    return {
      subject: payload.sub,
      email,
      firstName: readOptionalStringClaim(payload, 'given_name'),
      lastName: readOptionalStringClaim(payload, 'family_name'),
    };
  }

  // `jose` lève ses propres classes d'erreur (signature invalide, expiré,
  // issuer/audience incorrect...) — jamais laissées telles quelles jusqu'au
  // client, toujours traduites vers notre catalogue de codes.
  private async verifySignatureAndClaims(idToken: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(idToken, this.jwks, {
        issuer: this.config.issuer,
        audience: this.config.audience,
      });
      return payload;
    } catch (error) {
      throw new AppException(
        ErrorCode.AUTH_OAUTH_TOKEN_INVALID,
        error instanceof Error ? error.message : 'Token OIDC invalide',
      );
    }
  }
}
