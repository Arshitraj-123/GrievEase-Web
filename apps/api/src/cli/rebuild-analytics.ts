import { pool } from '../database/db';
import { MetricsService } from '../modules/analytics/metrics.service';
import { ReportExporterService } from '../modules/analytics/report-exporter.service';
import { AnalyticsService } from '../modules/analytics/analytics.service';
import { NotificationsGateway } from '../modules/notifications/notifications.gateway';
import { AuditService } from '../modules/audit/audit.service';

async function main() {
  const args = process.argv.slice(2);
  let societyId: string | undefined;
  let fromDate: string | undefined;
  let toDate: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--society' && args[i + 1]) {
      societyId = args[i + 1];
      i++;
    } else if (args[i] === '--from' && args[i + 1]) {
      fromDate = args[i + 1];
      i++;
    } else if (args[i] === '--to' && args[i + 1]) {
      toDate = args[i + 1];
      i++;
    }
  }

  console.log('🔄 [ANALYTICS:REBUILD] GrievEase Pre-Aggregation Table Rebuild CLI');
  console.log('-------------------------------------------------------------');

  const client = await pool.connect();
  try {
    let targetSocieties: string[] = [];
    if (societyId) {
      targetSocieties = [societyId];
    } else {
      const allSoc = await client.query('SELECT id, name FROM society');
      targetSocieties = allSoc.rows.map((r) => r.id);
      console.log(`ℹ️  No --society specified. Rebuilding for all ${targetSocieties.length} societies.`);
    }

    const metricsService = new MetricsService();
    const reportExporterService = new ReportExporterService();
    const gateway = new NotificationsGateway();
    const auditService = new AuditService();
    const analyticsService = new AnalyticsService(
      metricsService,
      reportExporterService,
      gateway,
      auditService
    );

    for (const sId of targetSocieties) {
      console.log(`\n⏳ Rebuilding society: ${sId} (From: ${fromDate || 'last 35 days'} To: ${toDate || 'today'})...`);
      const res = await analyticsService.rebuildSocietyAggregates(
        sId,
        fromDate,
        toDate,
        'cli:manual-rebuild'
      );
      console.log(`✅ Successfully processed ${res.processed} grievances (${res.errors} errors) for ${sId}`);
    }

    console.log('\n🎉 [ANALYTICS:REBUILD] All specified aggregates rebuilt and reconciled successfully!');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ [ANALYTICS:REBUILD] Rebuild failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
