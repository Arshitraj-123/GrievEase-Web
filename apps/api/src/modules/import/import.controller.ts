import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ImportService } from './import.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StepUpGuard } from '../../common/guards/step-up.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequireStepUp } from '../../common/decorators/require-step-up.decorator';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

@Controller('import')
@UseGuards(JwtGuard, RolesGuard)
export class ImportController {
  constructor(private importService: ImportService) {}

  @Get('template')
  @Roles('SUPER_ADMIN')
  downloadTemplate(@Res() res: Response) {
    const csv = this.importService.getTemplateCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="grievease_members_template.csv"');
    res.send(csv);
  }

  @Post('upload')
  @Roles('SUPER_ADMIN')
  async uploadFile(
    @Body() body: { fileBase64: string; filename: string },
    @CurrentUser() user: UserPayload
  ) {
    const buffer = Buffer.from(body.fileBase64, 'base64');
    return this.importService.processUpload(buffer, body.filename, user.societyId, user.userId);
  }

  @Post('commit')
  @UseGuards(StepUpGuard)
  @RequireStepUp()
  @Roles('SUPER_ADMIN')
  async commitBatch(
    @Body('batchId') batchId: string,
    @CurrentUser() user: UserPayload
  ) {
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return this.importService.commitBatch(batchId, user.societyId, user.userId, baseUrl);
  }

  @Post('rollback/:batchId')
  @Roles('SUPER_ADMIN')
  async rollbackBatch(
    @Param('batchId') batchId: string,
    @CurrentUser() user: UserPayload
  ) {
    return this.importService.rollbackBatch(batchId, user.societyId, user.userId);
  }

  @Post('slips/export-csv')
  @UseGuards(StepUpGuard)
  @RequireStepUp()
  @Roles('SUPER_ADMIN')
  async exportSlipsCsv(@Body('slips') slips: any[], @Res() res: Response) {
    const csv = this.importService.exportSlipsCsv(slips || []);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="confidential_credential_slips.csv"');
    res.send(csv);
  }
}
