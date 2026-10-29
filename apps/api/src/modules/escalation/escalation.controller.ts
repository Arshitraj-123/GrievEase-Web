import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { EscalationService } from './escalation.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('escalation')
@UseGuards(JwtGuard, RolesGuard)
export class EscalationController {
  constructor(private escalationService: EscalationService) {}

  @Get('monitor')
  @Roles('SUPER_ADMIN', 'SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY')
  async getMonitorStats(@CurrentUser('societyId') societyId: string) {
    return this.escalationService.getEscalationMonitorStats(societyId);
  }

  @Post('sweep')
  @Roles('SUPER_ADMIN')
  async triggerSweep() {
    return this.escalationService.runHourlySweep();
  }
}
