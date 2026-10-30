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
import { VendorsService } from './vendors.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateVendorSchema,
  CreateVendorTaskSchema,
  AcceptDeclineTaskSchema,
  ScheduleVisitSchema,
  CompleteVendorTaskSchema,
  ResidentConfirmTaskSchema,
} from '@grievease/contracts';

@Controller(['vendors', 'api/vendors'])
@UseGuards(JwtGuard, RolesGuard)
export class VendorsController {
  constructor(private vendorsService: VendorsService) {}

  // ─── Vendor View (Role: VENDOR) ───────────────────────────────────────────

  @Get('my-tasks')
  @Roles('VENDOR')
  async getMyTasks(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.vendorsService.listVendorTasks(user.societyId, {
      status,
      vendorId: user.vendorId,
    });
  }

  @Get('tasks/:id')
  @Roles('VENDOR')
  async getTaskForVendor(@CurrentUser() user: any, @Param('id') id: string) {
    return this.vendorsService.getTaskForVendor(user.societyId, id, user.userId);
  }

  @Post('tasks/:id/respond')
  @Roles('VENDOR')
  async respondTask(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const validated = AcceptDeclineTaskSchema.parse(body);
    return this.vendorsService.respondTask(user.societyId, id, user.userId, validated);
  }

  @Post('tasks/:id/schedule')
  @Roles('VENDOR')
  async scheduleVisit(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const validated = ScheduleVisitSchema.parse(body);
    return this.vendorsService.scheduleVisit(user.societyId, id, user.userId, validated);
  }

  @Post('tasks/:id/complete')
  @Roles('VENDOR')
  async completeTask(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const validated = CompleteVendorTaskSchema.parse(body);
    return this.vendorsService.completeTask(user.societyId, id, user.userId, validated);
  }

  // ─── Resident View ────────────────────────────────────────────────────────

  @Post('tasks/:id/resident-confirm')
  async residentConfirmTask(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const validated = ResidentConfirmTaskSchema.parse(body);
    return this.vendorsService.residentConfirmTask(user.societyId, id, user.userId, validated);
  }
}

@Controller(['admin/vendors', 'api/admin/vendors'])
@UseGuards(JwtGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE')
export class AdminVendorsController {
  constructor(private vendorsService: VendorsService) {}

  @Get()
  async listVendors(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.vendorsService.listVendors(user.societyId, status);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async createVendor(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateVendorSchema.parse(body);
    return this.vendorsService.createVendor(user.societyId, user.userId, validated);
  }

  @Get(':id')
  async getVendor(@CurrentUser() user: any, @Param('id') id: string) {
    return this.vendorsService.getVendor(user.societyId, id);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async updateVendor(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.vendorsService.updateVendor(user.societyId, user.userId, id, body);
  }

  @Get(':id/performance')
  async getVendorPerformance(@CurrentUser() user: any, @Param('id') id: string) {
    return this.vendorsService.getVendorPerformance(user.societyId, id);
  }
}

@Controller(['admin/vendor-tasks', 'api/admin/vendor-tasks'])
@UseGuards(JwtGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE')
export class AdminVendorTasksController {
  constructor(private vendorsService: VendorsService) {}

  @Get()
  async listVendorTasks(
    @CurrentUser() user: any,
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: string,
    @Query('grievanceId') grievanceId?: string,
  ) {
    return this.vendorsService.listVendorTasks(user.societyId, {
      vendorId,
      status,
      grievanceId,
    });
  }

  @Post()
  @Roles('SUPER_ADMIN', 'SECRETARY')
  async createVendorTask(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateVendorTaskSchema.parse(body);
    return this.vendorsService.createTask(user.societyId, user.userId, validated);
  }
}
