import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { StaffCryptoService } from './staff-crypto.service';
import { StaffPassService } from './staff-pass.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [AuditModule, NotificationsModule, StorageModule],
  controllers: [StaffController],
  providers: [StaffService, StaffCryptoService, StaffPassService],
  exports: [StaffService, StaffPassService],
})
export class StaffModule {}
