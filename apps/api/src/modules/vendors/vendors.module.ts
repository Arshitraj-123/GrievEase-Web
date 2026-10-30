import { Module } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import {
  VendorsController,
  AdminVendorsController,
  AdminVendorTasksController,
} from './vendors.controller';
import { AuditModule } from '../audit/audit.module';
import { StaffCryptoService } from '../staff/staff-crypto.service';
import { VisitorPassService } from '../visitors/visitor-pass.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [
    VendorsController,
    AdminVendorsController,
    AdminVendorTasksController,
  ],
  providers: [VendorsService, StaffCryptoService, VisitorPassService],
  exports: [VendorsService],
})
export class VendorsModule {}
