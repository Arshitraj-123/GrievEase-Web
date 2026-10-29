import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

@Controller('audit')
@UseGuards(JwtGuard, RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'GOVERNING_BODY')
  async list(
    @CurrentUser() user: UserPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('actorId') actorId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string
  ) {
    return this.auditService.list(user.societyId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      startDate,
      endDate,
      actorId,
      action,
      entityType,
      entityId,
    });
  }

  @Get('verify')
  @Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'GOVERNING_BODY')
  async verifyChain(@CurrentUser() user: UserPayload) {
    return this.auditService.verify(user.societyId);
  }

  @Get('latest-hash')
  @Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'GOVERNING_BODY')
  async getLatestHash(@CurrentUser() user: UserPayload) {
    return this.auditService.getLatestHash(user.societyId);
  }

  @Get('export/csv')
  @Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'GOVERNING_BODY')
  async exportCsv(
    @CurrentUser() user: UserPayload,
    @Query('startDate') startDate: string | undefined,
    @Query('endDate') endDate: string | undefined,
    @Res() res: Response
  ) {
    const csvData = await this.auditService.exportCsv(user.societyId, { startDate, endDate });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit_log_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvData);
  }
}
