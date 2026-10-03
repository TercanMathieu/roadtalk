import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  type BlockUserDto,
  blockUserSchema,
  type FriendsOverviewDto,
  friendsOverviewSchema,
  type SendFriendRequestDto,
  sendFriendRequestSchema,
} from '@roadtalk/contracts';
import type { UserId } from '@roadtalk/domain-shared';

import { CurrentUserId } from '../../infrastructure/auth/current-user.decorator';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { ZodResponseInterceptor } from '../../infrastructure/http/zod-response.interceptor';
import { ZodValidationPipe } from '../../infrastructure/http/zod-validation.pipe';
import { FriendsService } from './friends.service';

// Chaque route renvoie l'état complet des amis de l'appelant : le mobile
// n'a jamais à recomposer lui-même une liste après une action.
@Controller('friends')
@UseGuards(JwtAuthGuard)
@UseInterceptors(new ZodResponseInterceptor(friendsOverviewSchema))
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  async overview(@CurrentUserId() userId: UserId): Promise<FriendsOverviewDto> {
    return this.friendsService.overview(userId);
  }

  @Post('requests')
  @HttpCode(HttpStatus.OK)
  async sendRequest(
    @CurrentUserId() userId: UserId,
    @Body(new ZodValidationPipe(sendFriendRequestSchema)) body: SendFriendRequestDto,
  ): Promise<FriendsOverviewDto> {
    return this.friendsService.sendRequest(userId, body.handle);
  }

  @Post('requests/:id/accept')
  @HttpCode(HttpStatus.OK)
  async acceptRequest(
    @CurrentUserId() userId: UserId,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FriendsOverviewDto> {
    return this.friendsService.acceptRequest(userId, id);
  }

  @Delete('requests/:id')
  async removeRequest(
    @CurrentUserId() userId: UserId,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<FriendsOverviewDto> {
    return this.friendsService.removeRequest(userId, id);
  }

  @Post('blocks')
  @HttpCode(HttpStatus.OK)
  async block(
    @CurrentUserId() userId: UserId,
    @Body(new ZodValidationPipe(blockUserSchema)) body: BlockUserDto,
  ): Promise<FriendsOverviewDto> {
    return this.friendsService.block(userId, body.userId);
  }

  @Delete('blocks/:userId')
  async unblock(
    @CurrentUserId() userId: UserId,
    @Param('userId', ParseUUIDPipe) blockedId: string,
  ): Promise<FriendsOverviewDto> {
    return this.friendsService.unblock(userId, blockedId);
  }

  @Delete(':userId')
  async removeFriend(
    @CurrentUserId() userId: UserId,
    @Param('userId', ParseUUIDPipe) friendId: string,
  ): Promise<FriendsOverviewDto> {
    return this.friendsService.removeFriend(userId, friendId);
  }
}
