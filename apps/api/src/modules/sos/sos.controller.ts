import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SosService } from './sos.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  RaiseSosSchema,
  RespondSosSchema,
  ResolveSosSchema,
  StartDrillSchema,
  UpdateSosSettingSchema,
} from '@grievease/contracts';

@Controller('api/sos')
@UseGuards(JwtGuard, RolesGuard)
export class SosController {
  constructor(private readonly sosService: SosService) {}

  // Resident / Guard: Raise Emergency Alert
  @Post('raise')
  async raiseAlert(@CurrentUser() user: any, @Body() body: any) {
    const validated = RaiseSosSchema.parse(body);
    const isGuard = user.role === 'GUARD';
    return this.sosService.raiseAlert(user.societyId, user.userId, validated, isGuard);
  }

  // Resident: Cancel alert within grace window
  @Put('alerts/:id/cancel')
  async cancelAlert(@CurrentUser() user: any, @Param('id') alertId: string) {
    await this.sosService.cancelAlert(user.societyId, user.userId, alertId);
    return { success: true };
  }

  // Guard / Admin: First-ACK-wins
  @Post('alerts/:id/ack')
  @Roles('GUARD', 'SECRETARY', 'SUPER_ADMIN', 'COMMITTEE', 'CHAIRMAN')
  async acknowledgeAlert(@CurrentUser() user: any, @Param('id') alertId: string) {
    return this.sosService.acknowledgeAlert(user.societyId, user.userId, alertId);
  }

  // Guard / Responder: Post status update (ON_THE_WAY, ARRIVED, NOTE)
  @Post('alerts/:id/respond')
  @Roles('GUARD', 'SECRETARY', 'SUPER_ADMIN', 'COMMITTEE', 'CHAIRMAN')
  async respondAlert(
    @CurrentUser() user: any,
    @Param('id') alertId: string,
    @Body() body: any
  ) {
    const validated = RespondSosSchema.parse(body);
    return this.sosService.respondAlert(user.societyId, user.userId, alertId, validated);
  }

  // Resident / Admin / Guard: Resolve alert
  @Put('alerts/:id/resolve')
  async resolveAlert(
    @CurrentUser() user: any,
    @Param('id') alertId: string,
    @Body() body: any
  ) {
    const validated = ResolveSosSchema.parse(body);
    await this.sosService.resolveAlert(user.societyId, user.userId, alertId, validated);
    return { success: true };
  }

  // List alerts
  @Get('alerts')
  async listAlerts(
    @CurrentUser() user: any,
    @Query('flatId') flatId?: string,
    @Query('activeOnly') activeOnly?: string
  ) {
    const targetFlat = user.role === 'RESIDENT' ? user.flatId : flatId;
    return this.sosService.listAlerts(
      user.societyId,
      targetFlat,
      activeOnly === 'true'
    );
  }

  // Get alert responses timeline
  @Get('alerts/:id/responses')
  async getResponses(@CurrentUser() user: any, @Param('id') alertId: string) {
    return this.sosService.getResponses(user.societyId, alertId);
  }

  // Admin: Start Drill
  @Post('drills/start')
  @Roles('SUPER_ADMIN', 'SECRETARY', 'CHAIRMAN')
  async startDrill(@CurrentUser() user: any, @Body() body: any) {
    const validated = StartDrillSchema.parse(body);
    return this.sosService.startDrill(user.societyId, user.userId, validated);
  }

  // Admin: SOS Settings & Limits Notice
  @Get('settings')
  async getSettings(@CurrentUser() user: any) {
    return this.sosService.getSettings(user.societyId);
  }

  @Put('settings')
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async updateSettings(@CurrentUser() user: any, @Body() body: any) {
    const validated = UpdateSosSettingSchema.parse(body);
    return this.sosService.updateSettings(user.societyId, user.userId, validated);
  }
}
