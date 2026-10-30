import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreatePrivacyRequestSchema,
  VerifyPrivacyRequestSchema,
  AcceptConsentSchema,
} from '@grievease/contracts';

// ─── Public & Resident Privacy Endpoints ─────────────────────────────────────

@Controller(['privacy', 'api/privacy'])
export class PrivacyController {
  constructor(private privacyService: PrivacyService) {}

  @Post('requests/public')
  async submitPublicRequest(@Body() body: any) {
    const validated = CreatePrivacyRequestSchema.parse(body);
    // Defaults to societyId from request or first society
    const societyId = body.societyId || '00000000-0000-0000-0000-000000000000';
    return this.privacyService.submitPrivacyRequest(societyId, null, validated);
  }

  @Post('consent')
  @UseGuards(JwtGuard)
  async acceptConsent(@CurrentUser() user: any, @Body() body: any, @Req() req: any) {
    const validated = AcceptConsentSchema.parse(body);
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || undefined;
    return this.privacyService.recordConsent(user.userId, validated.version, String(ip), userAgent);
  }

  @Get('consent/status')
  @UseGuards(JwtGuard)
  async checkConsent(@CurrentUser() user: any, @Query('version') version?: string) {
    return this.privacyService.checkLatestConsent(user.userId, version || '2026.1');
  }

  @Get('me/export')
  @UseGuards(JwtGuard)
  async downloadMyData(@CurrentUser() user: any) {
    return this.privacyService.generateUserDataExport(user.societyId, user.userId);
  }

  @Post('me/deletion-request')
  @UseGuards(JwtGuard)
  async requestAccountDeletion(@CurrentUser() user: any, @Body() body: any) {
    return this.privacyService.submitPrivacyRequest(user.societyId, user.userId, {
      type: 'DELETION',
      requesterName: user.username,
      details: body.reason || 'User requested account closure and erasure from mobile/web app.',
    });
  }
}

// ─── Admin Privacy Management ────────────────────────────────────────────────

@Controller(['admin/privacy-requests', 'api/admin/privacy-requests'])
@UseGuards(JwtGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY')
export class AdminPrivacyController {
  constructor(private privacyService: PrivacyService) {}

  @Get()
  async listRequests(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.privacyService.listPrivacyRequests(user.societyId, status);
  }

  @Post(':id/verify')
  async verifyRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const validated = VerifyPrivacyRequestSchema.parse(body);
    return this.privacyService.verifyPrivacyRequest(user.societyId, id, user.userId, validated);
  }
}

@Controller(['admin/audit/sensitive-access', 'api/admin/audit/sensitive-access'])
@UseGuards(JwtGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY')
export class AdminSensitiveAccessController {
  constructor(private privacyService: PrivacyService) {}

  @Get()
  async listSensitiveAccess(@CurrentUser() user: any, @Query('limit') limit?: number) {
    return this.privacyService.listSensitiveAccessLogs(user.societyId, limit ? Number(limit) : 100);
  }
}

