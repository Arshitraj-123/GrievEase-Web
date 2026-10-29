import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { VisitorPassService } from './visitor-pass.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateVisitorPassSchema,
  CreateWalkinSchema,
  RespondApprovalSchema,
  CreateDeliveryExpectedSchema,
  LogDeliveryArrivalSchema,
  CreateBlocklistSchema,
  CreateFrequentVisitorSchema,
} from '@grievease/contracts';

@Controller('api/visitors')
@UseGuards(JwtGuard, RolesGuard)
export class VisitorsController {
  constructor(
    private readonly visitorsService: VisitorsService,
    private readonly passService: VisitorPassService
  ) {}

  // Resident: Create pre-approved visitor pass
  @Post('passes')
  async createPass(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateVisitorPassSchema.parse(body);
    return this.visitorsService.createPass(user.societyId, user.userId, validated);
  }

  // Resident: List passes for their flat
  @Get('passes')
  async listPasses(@CurrentUser() user: any, @Query('flatId') flatId?: string) {
    const targetFlat = user.role === 'RESIDENT' ? user.flatId : flatId;
    return this.visitorsService.listPasses(user.societyId, targetFlat);
  }

  // Resident: Cancel pass
  @Put('passes/:id/cancel')
  async cancelPass(@CurrentUser() user: any, @Param('id') passId: string) {
    await this.visitorsService.cancelPass(user.societyId, user.userId, passId);
    return { success: true };
  }

  // Guard/Admin: Verify QR token or 6-digit gate code
  @Post('verify')
  @Roles('GUARD', 'SECRETARY', 'SUPER_ADMIN', 'COMMITTEE', 'CHAIRMAN')
  async verifyPass(
    @CurrentUser() user: any,
    @Body() body: { token?: string; code?: string }
  ) {
    if (body.token) {
      return this.passService.verifyToken(body.token, user.societyId);
    }
    if (body.code) {
      return this.passService.verifyCode(body.code, user.societyId);
    }
    return { isValid: false, reason: 'Provide either token or 6-digit gate code' };
  }

  // Guard: Confirm pass entry
  @Post('passes/:id/admit')
  @Roles('GUARD', 'SECRETARY', 'SUPER_ADMIN')
  async admitPass(
    @Param('id') passId: string
  ) {
    await this.passService.recordEntry(passId);
    return { success: true };
  }

  // Guard: Create Walk-in visit
  @Post('walkin')
  @Roles('GUARD', 'SECRETARY', 'SUPER_ADMIN')
  async createWalkin(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateWalkinSchema.parse(body);
    return this.visitorsService.createWalkin(user.societyId, user.userId, validated);
  }

  // Resident: Respond to live walk-in approval request
  @Post('approvals/respond')
  async respondApproval(@CurrentUser() user: any, @Body() body: any) {
    const validated = RespondApprovalSchema.parse(body);
    return this.visitorsService.respondApproval(user.societyId, user.userId, validated);
  }

  // Resident / Guard: List visits
  @Get('logs')
  async listVisits(
    @CurrentUser() user: any,
    @Query('flatId') flatId?: string,
    @Query('onlyInside') onlyInside?: string
  ) {
    const targetFlat = user.role === 'RESIDENT' ? user.flatId : flatId;
    return this.visitorsService.listVisits(
      user.societyId,
      targetFlat,
      onlyInside === 'true'
    );
  }

  // Guard: Mark visit exit
  @Put('logs/:id/exit')
  @Roles('GUARD', 'SECRETARY', 'SUPER_ADMIN')
  async markExit(@CurrentUser() user: any, @Param('id') visitId: string) {
    await this.visitorsService.markExit(user.societyId, user.userId, visitId);
    return { success: true };
  }

  // ============================================================================
  // DELIVERIES
  // ============================================================================

  @Post('deliveries/expected')
  async createExpectedDelivery(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateDeliveryExpectedSchema.parse(body);
    return this.visitorsService.createExpectedDelivery(user.societyId, user.userId, validated);
  }

  @Get('deliveries/expected')
  async listExpectedDeliveries(@CurrentUser() user: any, @Query('flatId') flatId?: string) {
    const targetFlat = user.role === 'RESIDENT' ? user.flatId : flatId;
    return this.visitorsService.listExpectedDeliveries(user.societyId, targetFlat);
  }

  @Post('deliveries/arrival')
  @Roles('GUARD', 'SECRETARY', 'SUPER_ADMIN')
  async logDeliveryArrival(@CurrentUser() user: any, @Body() body: any) {
    const validated = LogDeliveryArrivalSchema.parse(body);
    return this.visitorsService.logDeliveryArrival(user.societyId, user.userId, validated);
  }

  @Get('deliveries/logs')
  async listDeliveryLogs(@CurrentUser() user: any, @Query('flatId') flatId?: string) {
    const targetFlat = user.role === 'RESIDENT' ? user.flatId : flatId;
    return this.visitorsService.listDeliveryLogs(user.societyId, targetFlat);
  }

  @Put('deliveries/logs/:id/collect')
  async markDeliveryCollected(@CurrentUser() user: any, @Param('id') deliveryId: string) {
    await this.visitorsService.markDeliveryCollected(user.societyId, user.userId, deliveryId);
    return { success: true };
  }

  // ============================================================================
  // BLOCKLIST & FREQUENT VISITORS
  // ============================================================================

  @Post('blocklist')
  async addBlocklist(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateBlocklistSchema.parse(body);
    if (user.role === 'RESIDENT') {
      validated.flatId = user.flatId;
    }
    await this.visitorsService.addBlocklist(user.societyId, user.userId, validated);
    return { success: true };
  }

  @Get('blocklist')
  async listBlocklist(@CurrentUser() user: any, @Query('flatId') flatId?: string) {
    const targetFlat = user.role === 'RESIDENT' ? user.flatId : flatId;
    return this.visitorsService.listBlocklist(user.societyId, targetFlat);
  }

  @Post('frequent')
  async addFrequentVisitor(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateFrequentVisitorSchema.parse(body);
    if (user.role === 'RESIDENT') {
      validated.flatId = user.flatId;
    }
    await this.visitorsService.addFrequentVisitor(user.societyId, user.userId, validated);
    return { success: true };
  }

  @Get('frequent')
  async listFrequentVisitors(@CurrentUser() user: any, @Query('flatId') flatId?: string) {
    const targetFlat = user.role === 'RESIDENT' ? user.flatId : flatId;
    if (!targetFlat) throw new BadRequestException('Flat ID required');
    return this.visitorsService.listFrequentVisitors(user.societyId, targetFlat);
  }
}
