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
import { NoticesService } from './notices.service';
import {
  CreateNoticeSchema,
  UpdateNoticeSchema,
} from '@grievease/contracts';

@Controller()
@UseGuards(JwtGuard)
export class NoticesController {
  constructor(private noticesService: NoticesService) {}

  // ---------------------------------------------------------------------------
  // RESIDENT NOTICEBOARD ENDPOINTS
  // ---------------------------------------------------------------------------

  @Get('notices/categories')
  async getCategories(@CurrentUser('societyId') societyId: string) {
    return this.noticesService.ensureDefaultCategories(societyId);
  }

  @Get('notices')
  async getNotices(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('language') language: string = 'en',
    @Query('tab') tab?: 'all' | 'unread' | 'pinned',
    @Query('categoryId') categoryId?: string,
    @Query('search') search?: string
  ) {
    return this.noticesService.getNoticesForResident(societyId, userId, language, {
      tab,
      categoryId,
      search,
    });
  }

  @Get('notices/:id')
  async getNoticeDetail(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('language') language: string = 'en',
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.noticesService.getNoticeDetail(societyId, userId, id, language);
  }

  @Post('notices/:id/acknowledge')
  async acknowledgeNotice(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    const success = await this.noticesService.acknowledgeNotice(societyId, userId, id);
    return { success };
  }

  // ---------------------------------------------------------------------------
  // ADMIN NOTICEBOARD ENDPOINTS
  // ---------------------------------------------------------------------------

  @Get('admin/notices')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE')
  async getAdminNotices(@CurrentUser('societyId') societyId: string) {
    return this.noticesService.getAdminNotices(societyId);
  }

  @Post('admin/notices')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE')
  async createNotice(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Body() body: any
  ) {
    const parsed = CreateNoticeSchema.parse(body);
    return this.noticesService.createNotice(societyId, userId, parsed);
  }

  @Put('admin/notices/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE')
  async updateNotice(
    @CurrentUser('societyId') societyId: string,
    @CurrentUser('userId') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any
  ) {
    const parsed = UpdateNoticeSchema.parse(body);
    const success = await this.noticesService.updateNotice(societyId, userId, id, parsed);
    return { success };
  }

  @Get('admin/notices/:id/readers')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'CHAIRMAN', 'SECRETARY', 'COMMITTEE')
  async getReaderStats(
    @CurrentUser('societyId') societyId: string,
    @Param('id', ParseUUIDPipe) id: string
  ) {
    return this.noticesService.getNoticeReaderStats(societyId, id);
  }
}
