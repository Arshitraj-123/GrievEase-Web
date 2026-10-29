import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Res,
  Req,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AnalyticsRange,
  ReportType,
  ReportFormat,
  AnalyticsSettingsDto,
} from '@grievease/contracts';
import * as jwt from 'jsonwebtoken';

@Controller()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  // ==========================================
  // 1. PUBLIC ENDPOINTS
  // ==========================================

  /**
   * GET /public/society/:slug/dashboard
   * Public or Resident-restricted aggregate dashboard. Rate-limited, 60s cache, sends no cookies.
   */
  @Get('public/society/:slug/dashboard')
  async getPublicDashboard(
    @Param('slug') slug: string,
    @Query('range') range: AnalyticsRange = '30d',
    @Headers('authorization') authHeader: string | undefined,
    @Req() req: Request,
    @Res() res: Response
  ) {
    let isAuthenticatedResident = false;

    // Check optional token if present without failing
    const token =
      req.cookies?.accessToken ||
      authHeader?.replace('Bearer ', '');

    if (token) {
      try {
        const secret =
          process.env.JWT_SECRET ||
          'dev_jwt_secret_must_be_changed_in_production_environment_32chars!';
        const decoded = jwt.verify(token, secret) as any;
        if (decoded && decoded.societyId) {
          isAuthenticatedResident = true;
        }
      } catch {
        // Continue as unauthenticated visitor
      }
    }

    const data = await this.analyticsService.getPublicDashboard(
      slug,
      range,
      isAuthenticatedResident
    );

    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.json(data);
  }

  /**
   * GET /public/stats
   * Tiny landing page payload. Returns 204 if disabled, insufficient data, or RESIDENTS_ONLY.
   */
  @Get('public/stats')
  async getLandingStats(@Res() res: Response) {
    const stats = await this.analyticsService.getLandingStats();
    if (!stats) {
      return res.status(HttpStatus.NO_CONTENT).send();
    }
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.json(stats);
  }

  // ==========================================
  // 2. RESIDENT VIEW
  // ==========================================

  /**
   * GET /app/analytics
   * Resident portal dashboard with SLA compliance by level.
   */
  @Get('app/analytics')
  @UseGuards(JwtGuard)
  async getResidentAnalytics(
    @CurrentUser('societyId') societyId: string,
    @Query('range') range: AnalyticsRange = '30d'
  ) {
    return this.analyticsService.getResidentAnalytics(societyId, range);
  }

  // ==========================================
  // 3. ADMIN ANALYTICS & EXECUTIVE VIEWS
  // ==========================================

  /**
   * GET /admin/analytics
   * SECRETARY and above: Executive KPIs, trend, category mix, aging report, wing heatmap, level funnel.
   */
  @Get('admin/analytics')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY', 'SUPER_ADMIN')
  async getAdminAnalytics(
    @CurrentUser('societyId') societyId: string,
    @Query('range') range: AnalyticsRange = '30d',
    @Query('categoryId') categoryId?: string,
    @Query('priority') priority?: any,
    @Query('wingId') wingId?: string,
    @Query('level') level?: number
  ) {
    return this.analyticsService.getAdminAnalytics(societyId, {
      range,
      categoryId,
      priority,
      wingId,
      level,
    });
  }

  /**
   * GET /admin/performance
   * Full resolver performance table and leaderboard (COMMITTEE, CHAIRMAN, GOVERNING_BODY, SUPER_ADMIN).
   */
  @Get('admin/performance')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY', 'SUPER_ADMIN')
  async getResolverPerformance(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') currentUserId: string,
    @CurrentUser('role') role: string,
    @Query('level') level?: number
  ) {
    return this.analyticsService.getResolverPerformance(
      societyId,
      level ? Number(level) : undefined,
      currentUserId,
      role
    );
  }

  /**
   * GET /admin/performance/me
   * Resolver self-view: every resolver sees ONLY their own statistics.
   */
  @Get('admin/performance/me')
  @UseGuards(JwtGuard)
  async getMyPerformance(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') currentUserId: string
  ) {
    const data = await this.analyticsService.getResolverPerformance(
      societyId,
      undefined,
      currentUserId,
      'RESOLVER_SELF'
    );
    return data[0] || null;
  }

  /**
   * GET /admin/performance/:userId
   * Resolver drill-down with trend and SLA breach history.
   */
  @Get('admin/performance/:userId')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY', 'SUPER_ADMIN')
  async getResolverDetail(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') currentUserId: string,
    @CurrentUser('role') role: string,
    @Param('userId') targetUserId: string
  ) {
    return this.analyticsService.getResolverDetail(
      societyId,
      targetUserId,
      currentUserId,
      role
    );
  }

  /**
   * GET /admin/sla-breaches
   * Full ledger of all auto-escalation events.
   */
  @Get('admin/sla-breaches')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY', 'SUPER_ADMIN')
  async getSlaBreaches(
    @CurrentUser('societyId') societyId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.analyticsService.getSlaBreaches(
      societyId,
      {},
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 20
    );
  }

  /**
   * GET /admin/reports/:type
   * Server-side export generation (?format=json|xlsx|pdf).
   */
  @Get('admin/reports/:type')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY', 'SUPER_ADMIN')
  async exportReport(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Param('type') type: ReportType,
    @Query('format') format: ReportFormat = 'json',
    @Query() filters: any,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const result = await this.analyticsService.exportReport(
      societyId,
      type,
      format,
      filters,
      {
        userId,
        role,
        ip: req.ip || req.socket.remoteAddress,
      }
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

    if (Buffer.isBuffer(result.data)) {
      return res.send(result.data);
    }
    return res.json(result.data);
  }

  // ==========================================
  // 4. SETTINGS
  // ==========================================

  @Get('admin/settings/analytics')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async getAnalyticsSettings(@CurrentUser('societyId') societyId: string) {
    return this.analyticsService.getSocietySettings(societyId);
  }

  @Patch('admin/settings/analytics')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async updateAnalyticsSettings(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Body() dto: AnalyticsSettingsDto,
    @Req() req: Request
  ) {
    return this.analyticsService.updateSettings(societyId, dto, {
      userId,
      role,
      ip: req.ip || req.socket.remoteAddress,
    });
  }
}
