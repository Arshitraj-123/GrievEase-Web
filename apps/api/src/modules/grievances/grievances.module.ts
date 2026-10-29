import { Module } from '@nestjs/common';
import { GrievancesService } from './grievances.service';
import { GrievancesController, AdminGrievancesController } from './grievances.controller';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageModule } from '../storage/storage.module';
import { EscalationModule } from '../escalation/escalation.module';

@Module({
  imports: [AuditModule, NotificationsModule, StorageModule, EscalationModule],
  controllers: [GrievancesController, AdminGrievancesController],
  providers: [GrievancesService],
  exports: [GrievancesService],
})
export class GrievancesModule {}
