import { Module } from '@nestjs/common';

import { HealthController } from './health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { SearchModule } from './modules/search/search.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [AuthModule, SearchModule, UsersModule],
  controllers: [HealthController],
})
export class AppModule {}
