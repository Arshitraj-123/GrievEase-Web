import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AmenitiesService } from './amenities.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateAmenitySchema,
  CreateBookingSchema,
  CancelBookingSchema,
  isAdminRole,
} from '@grievease/contracts';

@Controller('api/amenities')
@UseGuards(JwtGuard, RolesGuard)
export class AmenitiesController {
  constructor(
    private readonly amenitiesService: AmenitiesService,
  ) {}

  // ─── Resident Endpoints ──────────────────────────────────────────────────

  @Get()
  async listAmenities(@CurrentUser() user: any) {
    return this.amenitiesService.listAmenities(user.societyId, user.language || 'en');
  }

  @Get('my-bookings')
  async getMyBookings(@CurrentUser() user: any) {
    return this.amenitiesService.getMyBookings(
      user.societyId,
      user.flatId,
      user.language || 'en',
    );
  }

  @Get('bookings/:id')
  async getBookingDetail(@CurrentUser() user: any, @Param('id') id: string) {
    return this.amenitiesService.getBookingDetail(
      user.societyId,
      id,
      user.userId,
      isAdminRole(user.role),
    );
  }

  @Post('bookings/:id/cancel')
  async cancelBooking(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const validated = CancelBookingSchema.parse(body);
    return this.amenitiesService.cancelBooking(
      user.societyId,
      user.userId,
      id,
      validated.reason,
      isAdminRole(user.role),
    );
  }

  @Get(':id')
  async getAmenity(@CurrentUser() user: any, @Param('id') id: string) {
    return this.amenitiesService.getAmenity(user.societyId, id, user.language || 'en');
  }

  @Get(':id/availability')
  async getAvailability(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const fromDate = from || new Date().toISOString();
    const toDate =
      to || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    return this.amenitiesService.getSlotAvailability(
      user.societyId,
      id,
      fromDate,
      toDate,
    );
  }

  @Post('bookings')
  async createBooking(
    @CurrentUser() user: any,
    @Body() body: any,
    @Req() req: any,
  ) {
    const validated = CreateBookingSchema.parse(body);
    return this.amenitiesService.createBooking(
      user.societyId,
      user.userId,
      user.flatId,
      validated,
      req.ip,
    );
  }
}

@Controller('api/admin/amenities')
@UseGuards(JwtGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'SECRETARY', 'COMMITTEE', 'CHAIRMAN')
export class AdminAmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Post()
  async createAmenity(@CurrentUser() user: any, @Body() body: any) {
    const validated = CreateAmenitySchema.parse(body);
    return this.amenitiesService.createAmenity(user.societyId, user.userId, validated);
  }

  @Put(':id')
  async updateAmenity(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const validated = CreateAmenitySchema.parse(body);
    return this.amenitiesService.updateAmenity(user.societyId, user.userId, id, validated);
  }

  @Post(':id/blackouts')
  async addBlackout(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.amenitiesService.addBlackout(user.societyId, user.userId, id, body);
  }

  @Get('bookings')
  async getBookings(@CurrentUser() user: any, @Query() query: any) {
    return this.amenitiesService.getAdminBookings(user.societyId, query);
  }

  @Post('bookings/:id/approve')
  async approveBooking(@CurrentUser() user: any, @Param('id') id: string) {
    return this.amenitiesService.approveBooking(user.societyId, user.userId, id);
  }

  @Post('bookings/:id/reject')
  async rejectBooking(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.amenitiesService.rejectBooking(user.societyId, user.userId, id, reason || 'Rejected by administrator');
  }

  @Post('bookings/:id/no-show')
  async markNoShow(@CurrentUser() user: any, @Param('id') id: string) {
    return this.amenitiesService.markNoShow(user.societyId, user.userId, id);
  }

  @Get('settings')
  async getSettings(@CurrentUser() user: any) {
    return this.amenitiesService.getSettings(user.societyId);
  }

  @Put('settings')
  async updateSettings(@CurrentUser() user: any, @Body() body: any) {
    return this.amenitiesService.updateSettings(user.societyId, user.userId, body);
  }

  @Get('reports')
  async getReports(
    @CurrentUser() user: any,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const toDate = to || new Date().toISOString();
    return this.amenitiesService.getAmenityReports(user.societyId, fromDate, toDate);
  }
}

@Controller('api/guard/amenities')
@UseGuards(JwtGuard, RolesGuard)
@Roles('GUARD', 'SUPER_ADMIN', 'SECRETARY', 'COMMITTEE', 'CHAIRMAN')
export class GuardAmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  @Get('today')
  async getTodaysBookings(@CurrentUser() user: any) {
    return this.amenitiesService.getTodaysBookings(user.societyId);
  }

  @Post('check-in')
  async checkIn(
    @CurrentUser() user: any,
    @Body() body: { bookingId: string; passToken?: string },
  ) {
    return this.amenitiesService.checkInBooking(
      user.societyId,
      user.userId,
      body.bookingId,
      body.passToken,
    );
  }

  @Post('no-show')
  async markNoShow(
    @CurrentUser() user: any,
    @Body() body: { bookingId: string },
  ) {
    return this.amenitiesService.markNoShow(user.societyId, user.userId, body.bookingId);
  }
}
