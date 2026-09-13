import { Module } from '@nestjs/common';

import { AuthInfrastructureModule } from '../../infrastructure/auth/auth-infrastructure.module';
import { PhotonGeocoder } from './photon.geocoder';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [AuthInfrastructureModule],
  controllers: [SearchController],
  providers: [SearchService, PhotonGeocoder],
})
export class SearchModule {}
