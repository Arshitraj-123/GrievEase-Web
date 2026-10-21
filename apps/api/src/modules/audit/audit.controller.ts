import { Controller, Get, Query, UseGuards } from '@nestjs/common';
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
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.auditService.list(user.societyId, Number(page), Number(limit));
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
}
