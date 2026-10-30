import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SystemService } from './system.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller(['admin/system', 'api/admin/system'])
@UseGuards(JwtGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY')
export class SystemController {
  constructor(private systemService: SystemService) {}

  @Get('overview')
  async getOverview(@CurrentUser() user: any) {
    return this.systemService.getSystemOverview(user.societyId);
  }

  @Get('backups')
  async listBackups() {
    return this.systemService.listBackups();
  }

  @Post('backups/record')
  @Roles('SUPER_ADMIN')
  async recordBackup(
    @Body()
    body: {
      backupType: string;
      fileName: string;
      sizeBytes: number;
      sha256: string;
      status: string;
      details?: string;
    },
  ) {
    return this.systemService.recordBackupRun(
      body.backupType,
      body.fileName,
      body.sizeBytes,
      body.sha256,
      body.status,
      body.details,
    );
  }
}

