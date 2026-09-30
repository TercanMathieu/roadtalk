import { Module } from '@nestjs/common';

import { HealthController } from './health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { RoutingModule } from './modules/routing/routing.module';
import { SearchModule } from './modules/search/search.module';
import { SearchHistoryModule } from './modules/search-history/search-history.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [AuthModule, RoutingModule, SearchModule, SearchHistoryModule, UsersModule],
  controllers: [HealthController],
})
export class AppModule {}
