import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { GuardsService } from './guards.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  SetGuardPinSchema,
  UnlockGuardPinSchema,
  CreateIncidentSchema,
  ScanCheckpointSchema,
  ShiftHandoverSchema,
  RegisterGateDeviceSchema,
} from '@grievease/contracts';

@Controller('api/guards')
@UseGuards(JwtGuard, RolesGuard)
export class GuardsController {
  constructor(private readonly guardsService: GuardsService) {}

  // ============================================================================
  // GUARD CONSOLE ROUTE ENDPOINTS
  // ============================================================================

  // Heartbeat every 15s from guard console
  @Post('heartbeat')
  @Roles('GUARD', 'SECRETARY', 'SUPER_ADMIN')
  async heartbeat(
    @CurrentUser() user: any,
    @Body() body: { deviceId?: string }
  ) {
    return this.guardsService.recordHeartbeat(user.userId, user.societyId, body.deviceId);
  }

  // Get online guard count & status
  @Get('status/online')
  async getOnlineStatus(@CurrentUser() user: any) {
    const onlineCount = this.guardsService.getOnlineGuardsCount(user.societyId);
    return {
      onlineCount,
      hasOnlineGuards: onlineCount > 0,
      timestamp: new Date().toISOString(),
    };
  }

  // Set Console PIN
  @Post('pin/set')
  @Roles('GUARD')
  async setPin(@CurrentUser() user: any, @Body() body: any) {
    const validated = SetGuardPinSchema.parse(body);
    await this.guardsService.setPin(user.userId, validated.pin);
    return { success: true };
  }

  // Unlock Console PIN
  @Post('pin/unlock')
  @Roles('GUARD')
  async unlockPin(@CurrentUser() user: any, @Body() body: any) {
    const validated = UnlockGuardPinSchema.parse(body);
    const valid = await this.guardsService.verifyPin(user.userId, validated.pin);
    if (!valid) {
      throw new UnauthorizedException('Incorrect PIN');
    }
    return { success: true };
  }

  // Check In Shift
  @Post('shift/check-in')
  @Roles('GUARD')
  async checkInShift(@CurrentUser() user: any, @Body() body: { shiftId?: string; deviceId?: string }) {
    await this.guardsService.checkInShift(user.societyId, user.userId, body.shiftId, body.deviceId);
    return { success: true };
  }

  // Check Out Shift
  @Post('shift/check-out')
  @Roles('GUARD')
  async checkOutShift(@CurrentUser() user: any, @Body() body: { shiftId?: string }) {
    await this.guardsService.checkOutShift(user.societyId, user.userId, body.shiftId);
    return { success: true };
  }

  // Log Incident
  @Post('incidents')
  @Roles('GUARD', 'SECRETARY', 'SUPER_ADMIN')
  async logIncident(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateIncidentSchema.parse(body);
    return this.guardsService.logIncident(user.societyId, user.userId, validated);
  }

  @Get('incidents')
  async listIncidents(@CurrentUser() user: any) {
    return this.guardsService.listIncidents(user.societyId);
  }

  // Checkpoints & Patrol
  @Get('checkpoints')
  async listCheckpoints(@CurrentUser() user: any) {
    return this.guardsService.listCheckpoints(user.societyId);
  }

  @Post('patrol/scan')
  @Roles('GUARD')
  async scanCheckpoint(@CurrentUser() user: any, @Body() body: any) {
    const validated = ScanCheckpointSchema.parse(body);
    return this.guardsService.scanCheckpoint(user.societyId, user.userId, validated);
  }

  // Shift Handover
  @Post('handover')
  @Roles('GUARD')
  async submitHandover(@CurrentUser() user: any, @Body() body: any) {
    const validated = ShiftHandoverSchema.parse(body);
    await this.guardsService.submitHandover(user.societyId, user.userId, validated);
    return { success: true };
  }

  // Guard Staff Pass Scanner Integration
  @Post('staff/verify-scan')
  @Roles('GUARD', 'SECRETARY', 'SUPER_ADMIN')
  async verifyStaffScan(@CurrentUser() user: any, @Body() body: { token: string }) {
    return this.guardsService.verifyAndLogStaffScan(user.societyId, user.userId, body.token);
  }

  // ============================================================================
  // ADMIN GUARD MANAGEMENT & DEVICE REGISTRATION
  // ============================================================================

  @Get('profiles')
  @Roles('SECRETARY', 'SUPER_ADMIN', 'COMMITTEE', 'CHAIRMAN')
  async listGuardProfiles(@CurrentUser() user: any) {
    return this.guardsService.listGuardProfiles(user.societyId);
  }

  @Get('profile/me')
  @Roles('GUARD')
  async getMyProfile(@CurrentUser() user: any) {
    return this.guardsService.getProfile(user.userId);
  }

  @Get('shifts')
  async listShifts(@CurrentUser() user: any, @Query('guardId') guardId?: string) {
    const target = user.role === 'GUARD' ? user.userId : guardId;
    return this.guardsService.listShifts(user.societyId, target);
  }

  @Post('devices')
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async registerDevice(@CurrentUser() user: any, @Body() body: any) {
    const validated = RegisterGateDeviceSchema.parse(body);
    return this.guardsService.registerDevice(user.societyId, user.userId, validated);
  }

  @Get('devices')
  @Roles('SUPER_ADMIN', 'SECRETARY', 'COMMITTEE')
  async listDevices(@CurrentUser() user: any) {
    return this.guardsService.listDevices(user.societyId);
  }

  @Put('devices/:id/revoke')
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async revokeDevice(@CurrentUser() user: any, @Param('id') deviceId: string) {
    await this.guardsService.revokeDevice(user.societyId, user.userId, deviceId);
    return { success: true };
  }
}
