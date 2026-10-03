import { Module } from '@nestjs/common';

import { AuthInfrastructureModule } from '../../infrastructure/auth/auth-infrastructure.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { RoutingModule } from '../routing/routing.module';
import { SearchModule } from '../search/search.module';
import { AiRoutesController } from './ai-routes.controller';
import { AiRoutesService } from './ai-routes.service';
import { ClaudeRoutePlanner } from './claude-route-planner';
import { ROUTE_PLANNER } from './route-planner.port';

@Module({
  imports: [DatabaseModule, AuthInfrastructureModule, SearchModule, RoutingModule],
  controllers: [AiRoutesController],
  providers: [AiRoutesService, { provide: ROUTE_PLANNER, useClass: ClaudeRoutePlanner }],
})
export class AiRoutesModule {}
