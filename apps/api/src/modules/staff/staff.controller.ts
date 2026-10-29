import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StaffService } from './staff.service';
import { StaffPassService } from './staff-pass.service';
import {
  RegisterStaffSchema,
  LinkExistingStaffSchema,
  MarkAttendanceSchema,
  VerifyStaffSchema,
  BlockStaffSchema,
  MergeStaffSchema,
  CreateStaffReviewSchema,
} from '@grievease/contracts';

@Controller()
@UseGuards(JwtGuard)
export class StaffController {
  constructor(
    private staffService: StaffService,
    private passService: StaffPassService
  ) {}

  // ---------------------------------------------------------------------------
  // RESIDENT STAFF ENDPOINTS
  // ---------------------------------------------------------------------------

  @Post('staff')
  async registerStaff(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Body() body: any
  ) {
    const parsed = RegisterStaffSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message);
    }
    return this.staffService.registerStaff(societyId, userId, parsed.data);
  }

  @Post('staff/link')
  async linkStaff(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Body() body: any
  ) {
    const parsed = LinkExistingStaffSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message);
    }
    return this.staffService.linkExistingStaff(societyId, userId, parsed.data);
  }

  @Get('staff')
  async getResidentStaff(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Query('flatId') flatId?: string
  ) {
    const effectiveFlatId = flatId || (await this.staffService.getUserFlatId(userId));
    return this.staffService.getResidentStaffList(societyId, userId, effectiveFlatId);
  }

  @Get('staff/:id')
  async getStaffDetail(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('flatId') flatId?: string
  ) {
    const effectiveFlatId = flatId || (await this.staffService.getUserFlatId(userId));
    return this.staffService.getStaffDetail(societyId, userId, effectiveFlatId, id);
  }

  @Post('staff/:id/attendance')
  async markAttendance(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any
  ) {
    const parsed = MarkAttendanceSchema.safeParse({ ...body, staffId: id });
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message);
    }
    return this.staffService.markAttendance(societyId, userId, parsed.data);
  }

  @Get('staff/:id/attendance')
  async getAttendance(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('flatId') flatId?: string,
    @Query('month') month?: string
  ) {
    const effectiveFlatId = flatId || (await this.staffService.getUserFlatId(userId));
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    return this.staffService.getStaffAttendance(id, effectiveFlatId || '', targetMonth);
  }

  @Post('staff/:id/reviews')
  async submitReview(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any
  ) {
    const parsed = CreateStaffReviewSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message);
    }
    return this.staffService.submitStaffReview(userId, id, parsed.data);
  }

  @Post('staff/verify-pass')
  async verifyPass(@Body('token') token: string) {
    if (!token) throw new BadRequestException('Pass token required');
    return this.passService.verify(token);
  }

  // ---------------------------------------------------------------------------
  // ADMIN STAFF MANAGEMENT ENDPOINTS
  // ---------------------------------------------------------------------------

  @Get('admin/staff')
  @UseGuards(RolesGuard)
  @Roles('SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'SUPER_ADMIN')
  async getAdminStaff(
    @CurrentUser('societyId') societyId: string,
    @Query('status') status?: string
  ) {
    return this.staffService.getAdminStaffList(societyId, status);
  }

  @Post('admin/staff/:id/verify')
  @UseGuards(RolesGuard)
  @Roles('SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'SUPER_ADMIN')
  async verifyStaff(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any
  ) {
    const parsed = VerifyStaffSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message);
    }
    return this.staffService.verifyStaff(societyId, userId, id, parsed.data);
  }

  @Post('admin/staff/:id/block')
  @UseGuards(RolesGuard)
  @Roles('SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'SUPER_ADMIN')
  async blockStaff(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any
  ) {
    const parsed = BlockStaffSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message);
    }
    return this.staffService.blockStaff(societyId, userId, id, parsed.data);
  }

  @Post('admin/staff/:id/unblock')
  @UseGuards(RolesGuard)
  @Roles('SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'SUPER_ADMIN')
  async unblockStaff(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason: string
  ) {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException('Unblock reason must be at least 5 characters');
    }
    return this.staffService.unblockStaff(societyId, userId, id, reason.trim());
  }

  @Get('admin/staff/:id/id-proof')
  @UseGuards(RolesGuard)
  @Roles('SECRETARY', 'SUPER_ADMIN')
  async getIdProofSignedUrl(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.staffService.getIdProofSignedUrl(societyId, userId, role, id);
  }

  @Post('admin/staff/merge')
  @UseGuards(RolesGuard)
  @Roles('SECRETARY', 'SUPER_ADMIN')
  async mergeStaff(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Body() body: any
  ) {
    const parsed = MergeStaffSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors[0]?.message);
    }
    return this.staffService.mergeStaff(societyId, userId, parsed.data);
  }
}
