import { Module } from '@nestjs/common';

import { AuthInfrastructureModule } from '../../infrastructure/auth/auth-infrastructure.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { RIDE_REPOSITORY } from './application/ride-repository.port';
import { RidesService } from './application/rides.service';
import { PrismaRideRepository } from './infrastructure/prisma-ride.repository';
import { RidesController } from './presentation/rides.controller';

@Module({
  imports: [DatabaseModule, AuthInfrastructureModule],
  controllers: [RidesController],
  providers: [RidesService, { provide: RIDE_REPOSITORY, useClass: PrismaRideRepository }],
})
export class RidesModule {}
