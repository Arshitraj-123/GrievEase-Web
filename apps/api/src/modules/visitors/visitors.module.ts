import { Module } from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { VisitorPassService } from './visitor-pass.service';
import { VisitorsController } from './visitors.controller';
import { StaffCryptoService } from '../staff/staff-crypto.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Module({
  controllers: [VisitorsController],
  providers: [
    VisitorsService,
    VisitorPassService,
    StaffCryptoService,
    NotificationsGateway,
  ],
  exports: [VisitorsService, VisitorPassService],
})
export class VisitorsModule {}
