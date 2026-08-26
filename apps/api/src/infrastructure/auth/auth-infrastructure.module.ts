import { Module } from '@nestjs/common';

import { AccessTokenService } from './access-token.service';
import { JwtAuthGuard } from './jwt-auth.guard';

// Le mécanisme générique "vérifier un token, savoir qui appelle" — utilisé
// par n'importe quel module ayant des routes protégées (users aujourd'hui,
// rides/routes plus tard). Distinct de modules/auth, qui gère "comment on
// obtient un token" (OAuth, rotation de refresh token).
@Module({
  providers: [AccessTokenService, JwtAuthGuard],
  exports: [AccessTokenService, JwtAuthGuard],
})
export class AuthInfrastructureModule {}
