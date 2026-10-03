import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  type AiRouteDto,
  aiRouteSchema,
  type GenerateAiRouteRequestDto,
  generateAiRouteRequestSchema,
} from '@roadtalk/contracts';
import type { UserId } from '@roadtalk/domain-shared';

import { CurrentUserId } from '../../infrastructure/auth/current-user.decorator';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ZodResponseInterceptor } from '../../infrastructure/http/zod-response.interceptor';
import { ZodValidationPipe } from '../../infrastructure/http/zod-validation.pipe';
import { AiRoutesService } from './ai-routes.service';

@Controller('ai-routes')
@UseGuards(JwtAuthGuard)
export class AiRoutesController {
  constructor(private readonly aiRoutesService: AiRoutesService) {}

  // 200 et non 201 : rien n'est enregistré, la proposition n'existe que dans
  // la réponse tant que le motard ne la sauvegarde pas.
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(new ZodResponseInterceptor(aiRouteSchema))
  async generate(
    @CurrentUserId() userId: UserId,
    @Body(new ZodValidationPipe(generateAiRouteRequestSchema)) request: GenerateAiRouteRequestDto,
  ): Promise<AiRouteDto> {
    return this.aiRoutesService.generate(userId, request);
  }
}
