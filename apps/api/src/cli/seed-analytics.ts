import { pool } from '../database/db';
import { MetricsService } from '../modules/analytics/metrics.service';
import { ReportExporterService } from '../modules/analytics/report-exporter.service';
import { AnalyticsService } from '../modules/analytics/analytics.service';
import { NotificationsGateway } from '../modules/notifications/notifications.gateway';
import { AuditService } from '../modules/audit/audit.service';

async function main() {
  const args = process.argv.slice(2);
  let totalCount = 100000;

  for (let i = 0; i < args.length; i++) {
    const nextArg = args[i + 1];
    if (args[i] === '--grievances' && nextArg) {
      totalCount = parseInt(nextArg, 10) || 100000;
      i++;
    }
  }

  console.log(`🌱 [SEED:ANALYTICS] GrievEase Realistic Data Generator (${totalCount} grievances)`);
  console.log('-------------------------------------------------------------');

  const client = await pool.connect();
  try {
    await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

    // 1. Ensure a demo society exists
    let socRes = await client.query("SELECT id, slug, timezone FROM society WHERE code = 'PALM-GROVE'");
    let societyId: string;
    let societySlug: string;

    if (socRes.rows.length === 0) {
      const insRes = await client.query(`
        INSERT INTO society (name, code, slug, address, city, state, pincode, timezone)
        VALUES ('Palm Grove Heights', 'PALM-GROVE', 'palm-grove', '100 Green Avenue', 'Mumbai', 'Maharashtra', '400001', 'Asia/Kolkata')
        RETURNING id, slug, timezone;
      `);
      societyId = insRes.rows[0].id;
      societySlug = insRes.rows[0].slug;
    } else {
      societyId = socRes.rows[0].id;
      societySlug = socRes.rows[0].slug || 'palm-grove';
      await client.query("UPDATE society SET slug = 'palm-grove' WHERE id = $1 AND slug IS NULL", [societyId]);
    }

    // 2. Ensure Wings and Flats
    const wingsData = ['Wing A', 'Wing B', 'Wing C', 'Wing D'];
    const wingIds: string[] = [];
    for (const wName of wingsData) {
      const wRes = await client.query(`
        INSERT INTO wing (society_id, name, total_floors, flats_per_floor)
        VALUES ($1, $2, 10, 4)
        ON CONFLICT DO NOTHING
        RETURNING id;
      `, [societyId, wName]);
      if (wRes.rows[0]) {
        wingIds.push(wRes.rows[0].id);
      } else {
        const existing = await client.query('SELECT id FROM wing WHERE society_id = $1 AND name = $2', [societyId, wName]);
        wingIds.push(existing.rows[0].id);
      }
    }

    const flatIds: { id: string; wingId: string }[] = [];
    for (const wId of wingIds) {
      for (let floor = 1; floor <= 5; floor++) {
        for (let unit = 1; unit <= 4; unit++) {
          const flatNum = `${floor}0${unit}`;
          const fRes = await client.query(`
            INSERT INTO flat (society_id, wing_id, flat_number, floor)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
            RETURNING id;
          `, [societyId, wId, flatNum, floor]);
          if (fRes.rows[0]) {
            flatIds.push({ id: fRes.rows[0].id, wingId: wId });
          } else {
            const existing = await client.query('SELECT id FROM flat WHERE society_id = $1 AND wing_id = $2 AND flat_number = $3', [societyId, wId, flatNum]);
            if (existing.rows[0]) flatIds.push({ id: existing.rows[0].id, wingId: wId });
          }
        }
      }
    }

    // 3. Ensure Categories
    const categoriesData = [
      { en: 'Water Supply & Plumbing', hi: 'जल आपूर्ति और प्लंबिंग', icon: 'droplet' },
      { en: 'Electrical & Power', hi: 'विद्युत और ऊर्जा', icon: 'zap' },
      { en: 'Lift & Elevators', hi: 'लिफ्ट और एलीवेटर', icon: 'arrow-up-down' },
      { en: 'Security & Access Control', hi: 'सुरक्षा और प्रवेश नियंत्रण', icon: 'shield' },
      { en: 'Sanitation & Waste', hi: 'स्वच्छता और कचरा प्रबंधन', icon: 'trash' },
      { en: 'Structural & Common Areas', hi: 'संरचनात्मक और सामान्य क्षेत्र', icon: 'home' },
    ];

    const categoryIds: string[] = [];
    for (const cat of categoriesData) {
      const cRes = await client.query(`
        INSERT INTO category (society_id, name_en, name_hi, icon)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
        RETURNING id;
      `, [societyId, cat.en, cat.hi, cat.icon]);
      if (cRes.rows[0]) {
        categoryIds.push(cRes.rows[0].id);
      } else {
        const existing = await client.query('SELECT id FROM category WHERE society_id = $1 AND name_en = $2', [societyId, cat.en]);
        categoryIds.push(existing.rows[0].id);
      }
    }

    // 4. Ensure Area Tags
    const areaTagsData = [
      { name: 'Wing A Main Lobby', qrSlug: 'wing-a-lobby' },
      { name: 'Basement Parking B2', qrSlug: 'basement-parking-b2' },
      { name: 'Clubhouse & Gym', qrSlug: 'clubhouse-gym' },
      { name: 'Central Garden & Play Area', qrSlug: 'central-garden' },
      { name: 'Main Gate 1', qrSlug: 'main-gate-1' },
    ];
    const areaTagIds: string[] = [];
    for (const at of areaTagsData) {
      const atRes = await client.query(`
        INSERT INTO area_tag (society_id, name, qr_slug)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
        RETURNING id;
      `, [societyId, at.name, at.qrSlug]);
      if (atRes.rows[0]) {
        areaTagIds.push(atRes.rows[0].id);
      } else {
        const existing = await client.query('SELECT id FROM area_tag WHERE society_id = $1 AND qr_slug = $2', [societyId, at.qrSlug]);
        if (existing.rows[0]) areaTagIds.push(existing.rows[0].id);
      }
    }

    // 5. Ensure Resolvers for Levels 1 to 4
    const resolversData = [
      { name: 'Rajesh Sharma', role: 'SECRETARY', level: 1, email: 'rajesh.secretary@palmgrove.test' },
      { name: 'Pooja Verma', role: 'COMMITTEE', level: 2, email: 'pooja.committee@palmgrove.test' },
      { name: 'Anil Deshmukh', role: 'CHAIRMAN', level: 3, email: 'anil.chairman@palmgrove.test' },
      { name: 'Governing Council Apex', role: 'GOVERNING_BODY', level: 4, email: 'apex.governing@palmgrove.test' },
    ];

    const resolverIdsByLevel: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const r of resolversData) {
      const uRes = await client.query(`
        INSERT INTO app_user (society_id, member_id, username, full_name, mobile, email, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
        ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name
        RETURNING id;
      `, [societyId, `MEM-${r.level}`, `user_level_${r.level}`, r.name, `980000000${r.level}`, r.email, r.role]);
      const uId = uRes.rows[0].id;
      if (resolverIdsByLevel[r.level]) {
        resolverIdsByLevel[r.level]!.push(uId);
      }

      // Governance assignment
      await client.query(`
        INSERT INTO governance_assignment (society_id, level, user_id, is_primary)
        VALUES ($1, $2, $3, true)
        ON CONFLICT DO NOTHING;
      `, [societyId, r.level, uId]);
    }

    // 6. Ensure default analytics settings
    await client.query(`
      INSERT INTO society_setting (society_id, key, value)
      VALUES
        ($1, 'public_dashboard_enabled', 'true'),
        ($1, 'public_dashboard_visibility', 'PUBLIC'),
        ($1, 'min_cell_size', '5'),
        ($1, 'perf_threshold_excellent', '90'),
        ($1, 'perf_threshold_on_track', '75')
      ON CONFLICT (society_id, key) DO UPDATE SET value = EXCLUDED.value;
    `, [societyId]);

    console.log(`\n📦 Generating ${totalCount} realistic historical grievances across 365 days...`);
    const now = Date.now();
    const batchSize = 2500;

    let insertedTotal = 0;
    const startTime = Date.now();

    for (let offset = 0; offset < totalCount; offset += batchSize) {
      const currentBatchCount = Math.min(batchSize, totalCount - offset);
      await client.query('BEGIN');

      for (let i = 0; i < currentBatchCount; i++) {
        const itemIndex = offset + i;
        const daysAgo = Math.floor(Math.random() * 365);
        const createdMs = now - (daysAgo * 24 * 60 * 60 * 1000) - Math.floor(Math.random() * 86400000);
        const createdAt = new Date(createdMs);

        const isAnonymous = Math.random() < 0.15; // 15% anonymous
        const categoryId = categoryIds[itemIndex % categoryIds.length];
        const flatChoice = flatIds.length > 0 ? flatIds[itemIndex % flatIds.length] : undefined;
        const flatId = isAnonymous || !flatChoice ? null : flatChoice.id;
        const areaTagId = areaTagIds.length > 0 ? areaTagIds[itemIndex % areaTagIds.length] : null;

        const priorityRand = Math.random();
        const priority = priorityRand < 0.7 ? 'NORMAL' : priorityRand < 0.9 ? 'URGENT' : 'EMERGENCY';

        // Status distribution: 75% RESOLVED/CLOSED, 15% IN_PROGRESS/ACKNOWLEDGED, 5% ESCALATED, 5% SUBMITTED
        const statusRand = Math.random();
        let status = 'RESOLVED';
        let level = 1;
        let resolvedAt: Date | null = null;
        let closedAt: Date | null = null;

        if (statusRand < 0.65) {
          status = 'RESOLVED';
          level = Math.random() < 0.8 ? 1 : 2;
          const resolveHours = 2 + Math.floor(Math.random() * 40);
          resolvedAt = new Date(createdMs + resolveHours * 3600000);
        } else if (statusRand < 0.85) {
          status = 'CLOSED';
          level = 1;
          const resolveHours = 4 + Math.floor(Math.random() * 30);
          resolvedAt = new Date(createdMs + resolveHours * 3600000);
          closedAt = new Date(resolvedAt.getTime() + 48 * 3600000);
        } else if (statusRand < 0.93) {
          status = 'IN_PROGRESS';
          level = Math.random() < 0.7 ? 1 : 2;
        } else if (statusRand < 0.97) {
          status = 'ESCALATED';
          level = Math.random() < 0.6 ? 2 : Math.random() < 0.8 ? 3 : 4;
        } else {
          status = 'SUBMITTED';
          level = 1;
        }

        const resolverPool = resolverIdsByLevel[level] || resolverIdsByLevel[1] || [];
        const assignedTo = resolverPool[0] || null;

        const publicId = `GR-2025-${String(itemIndex + 1).padStart(5, '0')}`;
        const title = `Issue Report #${itemIndex + 1} - Maintenance Notification`;
        const description = `Operational maintenance and inspection request details logged automatically for index ${itemIndex + 1}.`;

        const slaDueAt = new Date(createdMs + 48 * 3600000);

        const gRes = await client.query(`
          INSERT INTO grievance (
            society_id, public_id, category_id, title, description, priority,
            area_tag_id, current_level, assigned_to, sla_due_at, is_anonymous,
            flat_id, status, created_at, resolved_at, closed_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING id;
        `, [
          societyId, publicId, categoryId, title, description, priority,
          areaTagId, level, assignedTo, slaDueAt, isAnonymous,
          flatId, status, createdAt, resolvedAt, closedAt,
        ]);

        const gId = gRes.rows[0].id;

        // Add rating for 70% of resolved/closed items
        if ((status === 'RESOLVED' || status === 'CLOSED') && Math.random() < 0.7) {
          const starsRand = Math.random();
          const stars = starsRand < 0.6 ? 5 : starsRand < 0.85 ? 4 : starsRand < 0.95 ? 3 : 2;
          await client.query(`
            INSERT INTO rating (society_id, grievance_id, stars, created_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING;
          `, [societyId, gId, stars, resolvedAt || createdAt]);
        }

        // Add escalation log for escalated items
        if (status === 'ESCALATED' || level > 1) {
          await client.query(`
            INSERT INTO escalation_log (society_id, grievance_id, level_from, level_to, reason, actor_id, created_at)
            VALUES ($1, $2, $3, $4, 'AUTO_SLA', $5, $6)
            ON CONFLICT DO NOTHING;
          `, [societyId, gId, Math.max(1, level - 1), level, assignedTo, createdAt]);
        }
      }

      await client.query('COMMIT');
      insertedTotal += currentBatchCount;
      const progressPct = Math.round((insertedTotal / totalCount) * 100);
      process.stdout.write(`\r⏳ Seed Progress: ${insertedTotal} / ${totalCount} (${progressPct}%) [Elapsed: ${Math.round((Date.now() - startTime) / 1000)}s]`);
    }

    console.log(`\n\n✅ Successfully seeded ${totalCount} grievances into society ${societySlug}!`);

    // 7. Trigger aggregate rebuild
    console.log('🔄 Rebuilding pre-aggregation tables (grievance_daily_agg, level_time_agg, resolver_daily_agg, rating_daily_agg, wing_daily_agg)...');
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

    const rebuildRes = await analyticsService.rebuildSocietyAggregates(
      societyId,
      undefined,
      undefined,
      'seed:analytics-100k'
    );

    console.log(`🎉 [SEED:ANALYTICS] Complete! Pre-aggregates ready: ${rebuildRes.processed} records calculated in ${Math.round((Date.now() - startTime) / 1000)}s total.`);
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ [SEED:ANALYTICS] Seeding failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  main();
}
