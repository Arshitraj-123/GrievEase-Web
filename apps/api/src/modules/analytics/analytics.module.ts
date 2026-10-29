import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { MetricsService } from './metrics.service';
import { ReportExporterService } from './report-exporter.service';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuditModule, NotificationsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, MetricsService, ReportExporterService],
  exports: [AnalyticsService, MetricsService, ReportExporterService],
})
export class AnalyticsModule {}
