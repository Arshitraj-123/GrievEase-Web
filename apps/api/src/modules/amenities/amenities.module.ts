import { Module } from '@nestjs/common';
import {
  AmenitiesController,
  AdminAmenitiesController,
  GuardAmenitiesController,
} from './amenities.controller';
import { AmenitiesService } from './amenities.service';
import { BookingPassService } from './booking-pass.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [
    AmenitiesController,
    AdminAmenitiesController,
    GuardAmenitiesController,
  ],
  providers: [AmenitiesService, BookingPassService],
  exports: [AmenitiesService, BookingPassService],
})
export class AmenitiesModule {}
