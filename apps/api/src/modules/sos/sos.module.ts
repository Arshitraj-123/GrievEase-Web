import { Module } from '@nestjs/common';
import { SosService } from './sos.service';
import { SosController } from './sos.controller';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Module({
  controllers: [SosController],
  providers: [SosService, NotificationsGateway],
  exports: [SosService],
})
export class SosModule {}
