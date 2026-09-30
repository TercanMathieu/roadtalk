import { Body, Controller, Get, HttpCode, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  type AddressHistoryDto,
  addressHistorySchema,
  type RecordAddressSelectionDto,
  recordAddressSelectionSchema,
} from '@roadtalk/contracts';
import type { UserId } from '@roadtalk/domain-shared';

import { CurrentUserId } from '../../infrastructure/auth/current-user.decorator';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ZodResponseInterceptor } from '../../infrastructure/http/zod-response.interceptor';
import { ZodValidationPipe } from '../../infrastructure/http/zod-validation.pipe';
import { SearchHistoryService } from './search-history.service';

// Toutes les routes portent sur "l'historique de l'appelant" — même
// convention que UsersController, pas de :id, l'identité vient du token.
@Controller('search-history')
@UseGuards(JwtAuthGuard)
export class SearchHistoryController {
  constructor(private readonly searchHistoryService: SearchHistoryService) {}

  @Get()
  @UseInterceptors(new ZodResponseInterceptor(addressHistorySchema))
  async list(@CurrentUserId() userId: UserId): Promise<AddressHistoryDto> {
    return this.searchHistoryService.list(userId);
  }

  @Post()
  @HttpCode(204)
  async recordSelection(
    @CurrentUserId() userId: UserId,
    @Body(new ZodValidationPipe(recordAddressSelectionSchema)) selection: RecordAddressSelectionDto,
  ): Promise<void> {
    await this.searchHistoryService.recordSelection(userId, selection);
  }
}
