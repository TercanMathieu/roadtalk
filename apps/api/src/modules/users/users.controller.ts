import { Body, Controller, Delete, Get, HttpCode, Patch, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  type SetUsernameDto,
  setUsernameSchema,
  type UpdateUserDto,
  updateUserSchema,
  type UserDto,
  userSchema,
} from '@roadtalk/contracts';
import type { UserId } from '@roadtalk/domain-shared';

import { CurrentUserId } from '../../infrastructure/auth/current-user.decorator';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ZodResponseInterceptor } from '../../infrastructure/http/zod-response.interceptor';
import { ZodValidationPipe } from '../../infrastructure/http/zod-validation.pipe';
import { UsersService } from './users.service';

// Toutes les routes portent sur "le compte de l'appelant" : plus de :id dans
// l'URL depuis qu'un token vérifié identifie l'utilisateur. Pas de cas
// d'usage V1 où quelqu'un a besoin de lire/modifier un autre compte.
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseInterceptors(new ZodResponseInterceptor(userSchema))
  async getMe(@CurrentUserId() userId: UserId): Promise<UserDto> {
    return this.usersService.getById(userId);
  }

  @Patch('me')
  @UseInterceptors(new ZodResponseInterceptor(userSchema))
  async updateMe(
    @CurrentUserId() userId: UserId,
    @Body(new ZodValidationPipe(updateUserSchema)) patch: UpdateUserDto,
  ): Promise<UserDto> {
    return this.usersService.update(userId, patch);
  }

  @Patch('me/username')
  @UseInterceptors(new ZodResponseInterceptor(userSchema))
  async setUsername(
    @CurrentUserId() userId: UserId,
    @Body(new ZodValidationPipe(setUsernameSchema)) body: SetUsernameDto,
  ): Promise<UserDto> {
    return this.usersService.setUsername(userId, body.username);
  }

  @Delete('me')
  @HttpCode(204)
  async deleteMe(@CurrentUserId() userId: UserId): Promise<void> {
    await this.usersService.delete(userId);
  }
}
