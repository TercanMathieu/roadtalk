import { Module } from '@nestjs/common';

import { AuthInfrastructureModule } from '../../infrastructure/auth/auth-infrastructure.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { ROUTE_REPOSITORY } from './application/route-repository.port';
import { RoutesService } from './application/routes.service';
import { PrismaRouteRepository } from './infrastructure/prisma-route.repository';
import { RoutesController } from './presentation/routes.controller';

@Module({
  imports: [DatabaseModule, AuthInfrastructureModule],
  controllers: [RoutesController],
  providers: [RoutesService, { provide: ROUTE_REPOSITORY, useClass: PrismaRouteRepository }],
})
export class RoutesModule {}
