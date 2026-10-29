import { Module } from '@nestjs/common';
import { GuardsService } from './guards.service';
import { GuardsController } from './guards.controller';
import { StaffPassService } from '../staff/staff-pass.service';
import { StaffCryptoService } from '../staff/staff-crypto.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Module({
  controllers: [GuardsController],
  providers: [
    GuardsService,
    StaffPassService,
    StaffCryptoService,
    NotificationsGateway,
  ],
  exports: [GuardsService],
})
export class GuardsModule {}
