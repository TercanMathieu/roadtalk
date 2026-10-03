import { Module } from '@nestjs/common';

import { HealthController } from './health/health.controller';
import { AiRoutesModule } from './modules/ai-routes/ai-routes.module';
import { AuthModule } from './modules/auth/auth.module';
import { RidesModule } from './modules/rides/rides.module';
import { RoutesModule } from './modules/routes/routes.module';
import { RoutingModule } from './modules/routing/routing.module';
import { SearchModule } from './modules/search/search.module';
import { SearchHistoryModule } from './modules/search-history/search-history.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    AiRoutesModule,
    AuthModule,
    RidesModule,
    RoutesModule,
    RoutingModule,
    SearchModule,
    SearchHistoryModule,
    UsersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
