import { Module } from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import {
  PrivacyController,
  AdminPrivacyController,
  AdminSensitiveAccessController,
} from './privacy.controller';
import { AuditModule } from '../audit/audit.module';
import { StaffCryptoService } from '../staff/staff-crypto.service';

@Module({
  imports: [AuditModule],
  controllers: [
    PrivacyController,
    AdminPrivacyController,
    AdminSensitiveAccessController,
  ],
  providers: [PrivacyService, StaffCryptoService],
  exports: [PrivacyService],
})
export class PrivacyModule {}

