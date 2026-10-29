import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DirectoryService } from './directory.service';
import {
  DirectoryPreferenceSchema,
  CreateEmergencyContactSchema,
  CreateServiceReviewSchema,
} from '@grievease/contracts';

@Controller()
@UseGuards(JwtGuard)
export class DirectoryController {
  constructor(private directoryService: DirectoryService) {}

  // ---------------------------------------------------------------------------
  // RESIDENT DIRECTORY ENDPOINTS
  // ---------------------------------------------------------------------------

  @Get('directory')
  async searchDirectory(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Query('query') query: string = '',
    @Query('wingId') wingId?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20'
  ) {
    return this.directoryService.searchDirectory(
      societyId,
      userId,
      query,
      wingId,
      parseInt(page, 10),
      parseInt(limit, 10)
    );
  }

  @Get('directory/preference')
  async getMyPreference(@CurrentUser('userId') userId: string) {
    return this.directoryService.getDirectoryPreference(userId);
  }

  @Put('directory/preference')
  async updateMyPreference(
    @CurrentUser('userId') userId: string,
    @Body() body: any
  ) {
    const parsed = DirectoryPreferenceSchema.parse(body);
    const success = await this.directoryService.updateDirectoryPreference(userId, parsed);
    return { success };
  }

  @Get('directory/office-bearers')
  async getOfficeBearers(@CurrentUser('societyId') societyId: string) {
    return this.directoryService.getOfficeBearers(societyId);
  }

  @Get('emergency-contacts')
  async getEmergencyContacts(@CurrentUser('societyId') societyId: string) {
    return this.directoryService.getEmergencyContacts(societyId);
  }

  @Get('directory/services')
  async getServiceProviders(
    @CurrentUser('societyId') societyId: string,
    @Query('category') category?: string
  ) {
    return this.directoryService.getServiceProviders(societyId, category);
  }

  @Post('directory/services/:id/reviews')
  async submitReview(
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any
  ) {
    const parsed = CreateServiceReviewSchema.parse(body);
    const success = await this.directoryService.submitServiceReview(userId, id, parsed);
    return { success };
  }

  // ---------------------------------------------------------------------------
  // ADMIN DIRECTORY ENDPOINTS
  // ---------------------------------------------------------------------------

  @Post('admin/emergency-contacts')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE')
  async createEmergencyContact(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Body() body: any
  ) {
    const parsed = CreateEmergencyContactSchema.parse(body);
    return this.directoryService.createEmergencyContact(societyId, userId, parsed);
  }

  @Post('admin/directory/reviews/:id/moderate')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE')
  async moderateReview(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { hide: boolean; reason: string }
  ) {
    const success = await this.directoryService.moderateReview(
      societyId,
      userId,
      id,
      body.hide,
      body.reason
    );
    return { success };
  }
}
