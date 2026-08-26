import { Module } from '@nestjs/common';

import { AuthInfrastructureModule } from '../../infrastructure/auth/auth-infrastructure.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DatabaseModule, AuthInfrastructureModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
