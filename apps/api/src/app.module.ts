import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ImportModule } from './modules/import/import.module';
import { SocietiesModule } from './modules/societies/societies.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { HealthModule } from './modules/health/health.module';
import { StorageModule } from './modules/storage/storage.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { EscalationModule } from './modules/escalation/escalation.module';
import { GrievancesModule } from './modules/grievances/grievances.module';

@Module({
  imports: [
    AuditModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    ImportModule,
    SocietiesModule,
    HealthModule,
    StorageModule,
    GovernanceModule,
    EscalationModule,
    GrievancesModule,
  ],
})
export class AppModule {}
