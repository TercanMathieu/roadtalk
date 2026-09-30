import { Module } from '@nestjs/common';

import { AuthInfrastructureModule } from '../../infrastructure/auth/auth-infrastructure.module';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { SearchHistoryController } from './search-history.controller';
import { SearchHistoryService } from './search-history.service';

@Module({
  imports: [AuthInfrastructureModule, DatabaseModule],
  controllers: [SearchHistoryController],
  providers: [SearchHistoryService],
})
export class SearchHistoryModule {}
