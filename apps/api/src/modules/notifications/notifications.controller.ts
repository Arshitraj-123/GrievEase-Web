import { Controller, Get, Patch, Post, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser, UserPayload } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: UserPayload) {
    const items = await this.notificationsService.getUserNotifications(user.userId);
    const unreadCount = await this.notificationsService.getUnreadCount(user.userId);
    return { items, unreadCount };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    return this.notificationsService.markAsRead(id, user.userId);
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: UserPayload) {
    return this.notificationsService.markAllAsRead(user.userId);
  }
}
