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
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NoticesModule } from './modules/notices/notices.module';
import { PollsModule } from './modules/polls/polls.module';
import { DirectoryModule } from './modules/directory/directory.module';
import { StaffModule } from './modules/staff/staff.module';
import { VisitorsModule } from './modules/visitors/visitors.module';
import { GuardsModule } from './modules/guards/guards.module';
import { SosModule } from './modules/sos/sos.module';
import { AmenitiesModule } from './modules/amenities/amenities.module';

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
    AnalyticsModule,
    NoticesModule,
    PollsModule,
    DirectoryModule,
    StaffModule,
    VisitorsModule,
    GuardsModule,
    SosModule,
    AmenitiesModule,
  ],
})
export class AppModule {}

