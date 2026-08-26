import { Body, Controller, HttpCode, Post, UseInterceptors } from '@nestjs/common';
import {
  type AppleLoginDto,
  appleLoginSchema,
  type GoogleLoginDto,
  googleLoginSchema,
  type RefreshTokenDto,
  refreshTokenSchema,
  type TokenPairDto,
  tokenPairSchema,
} from '@roadtalk/contracts';

import { ZodResponseInterceptor } from '../../infrastructure/http/zod-response.interceptor';
import { ZodValidationPipe } from '../../infrastructure/http/zod-validation.pipe';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('apple')
  @UseInterceptors(new ZodResponseInterceptor(tokenPairSchema))
  async loginWithApple(
    @Body(new ZodValidationPipe(appleLoginSchema)) body: AppleLoginDto,
  ): Promise<TokenPairDto> {
    return this.authService.loginWithApple(body.idToken, body.firstName, body.lastName);
  }

  @Post('google')
  @UseInterceptors(new ZodResponseInterceptor(tokenPairSchema))
  async loginWithGoogle(
    @Body(new ZodValidationPipe(googleLoginSchema)) body: GoogleLoginDto,
  ): Promise<TokenPairDto> {
    return this.authService.loginWithGoogle(body.idToken);
  }

  @Post('refresh')
  @UseInterceptors(new ZodResponseInterceptor(tokenPairSchema))
  async refresh(
    @Body(new ZodValidationPipe(refreshTokenSchema)) body: RefreshTokenDto,
  ): Promise<TokenPairDto> {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body(new ZodValidationPipe(refreshTokenSchema)) body: RefreshTokenDto): Promise<void> {
    await this.authService.logout(body.refreshToken);
  }
}
