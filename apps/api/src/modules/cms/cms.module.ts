import { Module } from '@nestjs/common';
import { CmsService } from './cms.service';
import {
  PublicCmsController,
  ResidentCmsController,
  AdminCmsController,
} from './cms.controller';
import { AuditModule } from '../audit/audit.module';
import { StaffCryptoService } from '../staff/staff-crypto.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [PublicCmsController, ResidentCmsController, AdminCmsController],
  providers: [CmsService, StaffCryptoService],
  exports: [CmsService],
})
export class CmsModule {}

