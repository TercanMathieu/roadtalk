import { Module } from '@nestjs/common';

import { AuthInfrastructureModule } from '../../infrastructure/auth/auth-infrastructure.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { UsersModule } from '../users/users.module';
import { AppleTokenVerifier } from './provider-token-verifer'
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleTokenVerifier } from './provider-token-verifer';

@Module({
  imports: [DatabaseModule, AuthInfrastructureModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, AppleTokenVerifier, GoogleTokenVerifier],
})
export class AuthModule {}
