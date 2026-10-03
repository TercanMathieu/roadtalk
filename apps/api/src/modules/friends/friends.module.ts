import { Module } from '@nestjs/common';

import { AuthInfrastructureModule } from '../../infrastructure/auth/auth-infrastructure.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';

@Module({
  imports: [DatabaseModule, AuthInfrastructureModule],
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
