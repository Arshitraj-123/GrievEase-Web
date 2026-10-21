import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  Ip,
  Headers,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

function getCookieName(baseName: string): string {
  const isHttps = process.env.BASE_URL?.startsWith('https');
  return isHttps ? `__Host-${baseName}` : baseName;
}

function getCookieOptions(maxAgeMs: number) {
  const isHttps = process.env.BASE_URL?.startsWith('https');
  const domain = process.env.COOKIE_DOMAIN || 'localhost';
  return {
    httpOnly: true,
    secure: isHttps || false,
    sameSite: 'lax' as const,
    maxAge: maxAgeMs,
    path: '/',
    ...(domain !== 'localhost' ? { domain } : {}),
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('challenge')
  getChallenge() {
    return this.authService.generateChallenge();
  }

  @Post('login')
  async login(
    @Body() body: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string = 'Browser',
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login(body, ip, userAgent);

    if (result.accessToken && result.refreshToken) {
      res.cookie(getCookieName('access_token'), result.accessToken, getCookieOptions(15 * 60 * 1000));
      res.cookie(getCookieName('refresh_token'), result.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));
    }

    return result;
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string = 'Browser'
  ) {
    const cookieName = getCookieName('refresh_token');
    const token = req.cookies?.[cookieName] || req.body?.refreshToken;

    const result = await this.authService.refreshToken(token, ip, userAgent);
    res.cookie(getCookieName('access_token'), result.accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie(getCookieName('refresh_token'), result.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    return { success: true };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(getCookieName('access_token'), { path: '/' });
    res.clearCookie(getCookieName('refresh_token'), { path: '/' });
    res.clearCookie(getCookieName('step_up_token'), { path: '/' });
    return { success: true, message: 'Logged out successfully.' };
  }

  @Post('2fa/verify')
  async verify2fa(
    @Body() body: { tempToken: string; code: string },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string = 'Browser',
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.verify2fa(body, ip, userAgent);
    res.cookie(getCookieName('access_token'), result.accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie(getCookieName('refresh_token'), result.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));
    return result;
  }

  @Post('step-up')
  @UseGuards(JwtGuard)
  async stepUp(
    @CurrentUser('userId') userId: string,
    @Body() body: { password: string; totpCode?: string },
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.stepUp(userId, body);
    res.cookie(getCookieName('step_up_token'), result.stepUpToken, getCookieOptions(5 * 60 * 1000));
    return result;
  }

  @Post('activate')
  async activate(@Body() body: { username: string; activationCode: string; verifyDetail: string }) {
    return this.authService.activate(body);
  }

  @Post('activate/password')
  async setInitialPassword(@Body() body: { activationToken: string; newPassword: string; confirmPassword?: string }) {
    return this.authService.setInitialPassword(body);
  }

  @Post('activate/recovery')
  async setupRecovery(
    @Body() body: { activationToken: string; questions: any[] },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string = 'Browser',
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.setupSecurityQuestions(body, ip, userAgent);
    res.cookie(getCookieName('access_token'), result.accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie(getCookieName('refresh_token'), result.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));
    return result;
  }

  @Post('activate/totp')
  async enrolTotp(@Body() body: { tempToken: string }) {
    return this.authService.enrolTotp(body.tempToken);
  }

  @Post('activate/totp/confirm')
  async confirmTotp(
    @Body() body: { totpToken: string; code: string },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string = 'Browser',
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.confirmTotpEnrolment(body, ip, userAgent);
    res.cookie(getCookieName('access_token'), result.accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie(getCookieName('refresh_token'), result.refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));
    return result;
  }

  @Post('recovery/start')
  async startRecovery(@Body() body: { username: string }) {
    return this.authService.startRecovery(body.username);
  }

  @Post('recovery/verify-questions')
  async verifyQuestions(@Body() body: { username: string; answers: any[] }, @Ip() ip: string) {
    return this.authService.verifySecurityAnswers(body, ip);
  }

  @Post('recovery/use-code')
  async useRecoveryCode(
    @Body() body: { username: string; recoveryCode: string; newPassword: string },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string = 'Browser'
  ) {
    return this.authService.useRecoveryCode(body, ip, userAgent);
  }

  @Post('recovery/reset-with-ticket')
  async resetPasswordWithTicket(
    @Body() body: { ticketToken: string; newPassword: string },
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string = 'Browser'
  ) {
    return this.authService.resetPasswordWithTicket(body, ip, userAgent);
  }

  @Get('setup/status')
  async getSetupStatus() {
    return this.authService.getSetupStatus();
  }

  @Post('setup')
  async setupFirstAdmin(@Body() body: { setupToken: string; name: string; username: string; password: string }) {
    return this.authService.setupFirstAdmin(body);
  }
}
