import { Module } from '@nestjs/common';

import { AuthInfrastructureModule } from '../../infrastructure/auth/auth-infrastructure.module';
import { RoutingController } from './routing.controller';
import { RoutingService } from './routing.service';
import { ValhallaRouter } from './valhalla.router';

@Module({
  imports: [AuthInfrastructureModule],
  controllers: [RoutingController],
  providers: [RoutingService, ValhallaRouter],
})
export class RoutingModule {}
