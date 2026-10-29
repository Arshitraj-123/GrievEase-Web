import crypto from 'crypto';
import { pool } from './db';

// Non-ambiguous alphabet: 32 chars (removes 0, O, 1, I, L)
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateActivationCode(): string {
  const bytes = crypto.randomBytes(10);
  let result = '';
  for (let i = 0; i < 10; i++) {
    const b = bytes[i] ?? 0;
    result += ALPHABET[b % ALPHABET.length] ?? '2';
  }
  return result;
}

function hashString(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Refusing to run dev seed script in production!');
    process.exit(1);
  }

  console.log('[SEED] Starting development seed for GrievEase...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Bypass RLS during initial administrative seed
    await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

    // 1. Create Demo Society
    const societyRes = await client.query(`
      INSERT INTO society (name, code, address, city, state, pincode)
      VALUES ('Green Valley Residency', 'GVR', 'Plot 42, Palm Avenue, Sector 5', 'Navi Mumbai', 'Maharashtra', '400705')
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, code;
    `);
    const societyId = societyRes.rows[0].id;
    console.log(`[SEED] Society created: ${societyRes.rows[0].name} (${societyId})`);

    // 2. Create Wings A and B
    const wingARes = await client.query(`
      INSERT INTO wing (society_id, name, total_floors, flats_per_floor)
      VALUES ($1, 'A', 5, 2) RETURNING id, name;
    `, [societyId]);
    const wingBRes = await client.query(`
      INSERT INTO wing (society_id, name, total_floors, flats_per_floor)
      VALUES ($1, 'B', 5, 2) RETURNING id, name;
    `, [societyId]);

    const wingAId = wingARes.rows[0].id;
    const wingBId = wingBRes.rows[0].id;

    // 3. Create 20 flats (10 in Wing A: A-101 to A-502; 10 in Wing B: B-101 to B-502)
    const flatList: { id: string; wingId: string; number: string }[] = [];
    for (let floor = 1; floor <= 5; floor++) {
      for (const flatNum of [1, 2]) {
        const numA = `A-${floor}0${flatNum}`;
        const resA = await client.query(
          `INSERT INTO flat (society_id, wing_id, flat_number, floor) VALUES ($1, $2, $3, $4) RETURNING id, flat_number;`,
          [societyId, wingAId, numA, floor]
        );
        flatList.push({ id: resA.rows[0].id, wingId: wingAId, number: numA });

        const numB = `B-${floor}0${flatNum}`;
        const resB = await client.query(
          `INSERT INTO flat (society_id, wing_id, flat_number, floor) VALUES ($1, $2, $3, $4) RETURNING id, flat_number;`,
          [societyId, wingBId, numB, floor]
        );
        flatList.push({ id: resB.rows[0].id, wingId: wingBId, number: numB });
      }
    }
    console.log(`[SEED] Created ${flatList.length} flats across Wings A and B.`);

    // 4. Create Demo Users for every role EXCEPT SUPER_ADMIN (no passwords seeded!)
    const demoUsersToSeed = [
      {
        role: 'SECRETARY',
        fullName: 'Rajesh Sharma',
        username: 'secretary.gvr',
        memberId: 'GV-A101-SEC',
        flat: flatList.find((f) => f.number === 'A-101')!,
        mobile: '+919876543210',
        email: 'secretary@greenvalley.local',
        verifyDetail: 'A-101',
      },
      {
        role: 'CHAIRMAN',
        fullName: 'Vikram Malhotra',
        username: 'chairman.gvr',
        memberId: 'GV-B502-CHM',
        flat: flatList.find((f) => f.number === 'B-502')!,
        mobile: '+919876543211',
        email: 'chairman@greenvalley.local',
        verifyDetail: 'B-502',
      },
      {
        role: 'COMMITTEE',
        fullName: 'Ananya Deshmukh',
        username: 'committee1.gvr',
        memberId: 'GV-A201-COM',
        flat: flatList.find((f) => f.number === 'A-201')!,
        mobile: '+919876543212',
        email: 'committee1@greenvalley.local',
        verifyDetail: 'A-201',
      },
      {
        role: 'GOVERNING_BODY',
        fullName: 'Col. Sanjeev Nair',
        username: 'governing.gvr',
        memberId: 'GV-B401-GB',
        flat: flatList.find((f) => f.number === 'B-401')!,
        mobile: '+919876543213',
        email: 'governing@greenvalley.local',
        verifyDetail: 'B-401',
      },
      {
        role: 'RESIDENT',
        fullName: 'Rohan Mehra',
        username: 'resident.rohan',
        memberId: 'GV-A102-R1',
        flat: flatList.find((f) => f.number === 'A-102')!,
        mobile: '+919876543214',
        email: 'rohan@example.local',
        verifyDetail: 'A-102',
      },
      {
        role: 'GUARD',
        fullName: 'Ramesh Yadav',
        username: 'guard.main',
        memberId: 'GV-GUARD-01',
        flat: null,
        mobile: '+919876543215',
        email: null,
        verifyDetail: '1988-06-15',
      },
      {
        role: 'VENDOR',
        fullName: 'Suresh Electrician',
        username: 'vendor.spark',
        memberId: 'GV-VEND-ELEC',
        flat: null,
        mobile: '+919876543216',
        email: null,
        verifyDetail: '1992-11-20',
      },
    ];

    const generatedCredentialsSummary: any[] = [];
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    for (const u of demoUsersToSeed) {
      const userRes = await client.query(
        `INSERT INTO app_user (
          society_id, flat_id, member_id, username, full_name, mobile, email,
          role, status, must_change_password
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'INVITED', true)
        ON CONFLICT (username) DO UPDATE SET full_name = EXCLUDED.full_name
        RETURNING id;`,
        [societyId, u.flat?.id || null, u.memberId, u.username, u.fullName, u.mobile, u.email, u.role]
      );
      const userId = userRes.rows[0].id;

      // Generate unambiguous activation code
      const code = generateActivationCode();
      const codeHash = hashString(code);
      const verifyHash = hashString(u.verifyDetail.trim().toLowerCase());

      await client.query(
        `INSERT INTO activation_code (
          user_id, code_hash, verify_detail_hash, expires_at, attempts
        ) VALUES ($1, $2, $3, $4, 0);`,
        [userId, codeHash, verifyHash, sevenDaysFromNow]
      );

      generatedCredentialsSummary.push({
        Role: u.role,
        Username: u.username,
        MemberID: u.memberId,
        VerifyDetail: u.verifyDetail,
        ActivationCode: code,
      });
    }

    // ==========================================
    // PHASE 3 SEEDING: GRIEVANCE MODULE
    // ==========================================
    console.log('[SEED] Seeding Phase 3 Categories, Area Tags, Governance Chain & SLA Configs...');

    // 5. Seed 8 Default Categories (with EN, HI, MR names & icons)
    const defaultCategories = [
      { name_en: 'Water Supply', name_hi: 'पानी की आपूर्ति', name_mr: 'पाणी पुरवठा', icon: 'Droplets', requires_photo: false, sort: 1 },
      { name_en: 'Electricity & Power', name_hi: 'बिजली और बिजली आपूर्ति', name_mr: 'वीज आणि विद्युत पुरवठा', icon: 'Zap', requires_photo: false, sort: 2 },
      { name_en: 'Cleanliness & Waste', name_hi: 'सफाई और कचरा प्रबंधन', name_mr: 'स्वच्छता आणि कचरा व्यवस्थापन', icon: 'Trash2', requires_photo: true, sort: 3 },
      { name_en: 'Security & Safety', name_hi: 'सुरक्षा और बचाव', name_mr: 'सुरक्षा आणि दक्षता', icon: 'Shield', requires_photo: false, sort: 4 },
      { name_en: 'Elevators & Lifts', name_hi: 'लिफ्ट और एलिवेटर', name_mr: 'लिफ्ट आणि एलेव्हेटर', icon: 'ArrowUpDown', requires_photo: false, sort: 5 },
      { name_en: 'Parking & Vehicles', name_hi: 'पार्किंग और वाहन', name_mr: 'पार्किंग आणि वाहने', icon: 'Car', requires_photo: false, sort: 6 },
      { name_en: 'Noise & Disturbance', name_hi: 'शोर और अशांति', name_mr: 'आवाज आणि उपद्रव', icon: 'Volume2', requires_photo: false, sort: 7 },
      { name_en: 'Maintenance & Repairs', name_hi: 'रखरखाव और मरम्मत', name_mr: 'देखभाल आणि दुरुस्ती', icon: 'Wrench', requires_photo: true, sort: 8 },
    ];

    for (const cat of defaultCategories) {
      await client.query(`
        INSERT INTO category (society_id, name_en, name_hi, name_mr, icon, requires_photo, sort, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        ON CONFLICT DO NOTHING;
      `, [societyId, cat.name_en, cat.name_hi, cat.name_mr, cat.icon, cat.requires_photo, cat.sort]);
    }

    // 6. Seed Area Tags with QR Slugs
    const defaultAreaTags = [
      { name: 'Main Entrance Gate', qr_slug: 'main-gate' },
      { name: 'Clubhouse & Gymnasium', qr_slug: 'clubhouse' },
      { name: 'Wing A Lobby & Lift', qr_slug: 'wing-a-lobby' },
      { name: 'Wing B Lobby & Lift', qr_slug: 'wing-b-lobby' },
      { name: 'Basement Parking Level -1', qr_slug: 'parking-b1' },
      { name: 'Rooftop & Terrace Garden', qr_slug: 'terrace' },
    ];

    for (const area of defaultAreaTags) {
      await client.query(`
        INSERT INTO area_tag (society_id, name, qr_slug)
        VALUES ($1, $2, $3)
        ON CONFLICT (society_id, qr_slug) DO NOTHING;
      `, [societyId, area.name, area.qr_slug]);
    }

    // 7. Seed 4 Governance Levels (Secretary, Committee, Chairman, Governing Body)
    const governanceLevels = [
      { level: 1, label: 'Secretary' },
      { level: 2, label: 'Executive Committee' },
      { level: 3, label: 'Society Chairman' },
      { level: 4, label: 'Governing Body' },
    ];

    for (const gl of governanceLevels) {
      await client.query(`
        INSERT INTO governance_level (society_id, level, label)
        VALUES ($1, $2, $3)
        ON CONFLICT (society_id, level) DO UPDATE SET label = EXCLUDED.label;
      `, [societyId, gl.level, gl.label]);
    }

    // 8. Assign Phase 2 Demo Users to Governance Levels
    const demoUserRows = await client.query(`SELECT id, username, role FROM app_user WHERE society_id = $1;`, [societyId]);
    const userMap = new Map(demoUserRows.rows.map((r: any) => [r.username, r.id]));

    const levelAssignments = [
      { level: 1, username: 'secretary.gvr', isPrimary: true },
      { level: 2, username: 'committee1.gvr', isPrimary: true },
      { level: 3, username: 'chairman.gvr', isPrimary: true },
      { level: 4, username: 'governing.gvr', isPrimary: true },
    ];

    for (const la of levelAssignments) {
      const targetUserId = userMap.get(la.username);
      if (targetUserId) {
        await client.query(`
          INSERT INTO governance_assignment (society_id, level, user_id, is_primary)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT DO NOTHING;
        `, [societyId, la.level, targetUserId, la.isPrimary]);
      }
    }

    // 9. Seed Default SLA Config
    // NORMAL priority: 48 / 72 / 96 / 120 hours
    // URGENT & EMERGENCY: Proposed placeholders marked "pending client confirmation"
    const slaMatrix = [
      { priority: 'NORMAL', level: 1, hours: 48 },
      { priority: 'NORMAL', level: 2, hours: 72 },
      { priority: 'NORMAL', level: 3, hours: 96 },
      { priority: 'NORMAL', level: 4, hours: 120 },

      // PROPOSED: Pending client confirmation
      { priority: 'URGENT', level: 1, hours: 24 },
      { priority: 'URGENT', level: 2, hours: 36 },
      { priority: 'URGENT', level: 3, hours: 48 },
      { priority: 'URGENT', level: 4, hours: 60 },

      // PROPOSED: Pending client confirmation
      { priority: 'EMERGENCY', level: 1, hours: 4 },
      { priority: 'EMERGENCY', level: 2, hours: 8 },
      { priority: 'EMERGENCY', level: 3, hours: 12 },
      { priority: 'EMERGENCY', level: 4, hours: 24 },
    ];

    for (const sla of slaMatrix) {
      await client.query(`
        INSERT INTO sla_config (society_id, category_id, priority, level, hours)
        VALUES ($1, NULL, $2, $3, $4)
        ON CONFLICT (society_id, category_id, priority, level) DO UPDATE SET hours = EXCLUDED.hours;
      `, [societyId, sla.priority, sla.level, sla.hours]);
    }

    // 10. Seed Default Society Settings
    const defaultSettings = [
      { key: 'rate_limit_per_24h', value: '5' },
      { key: 'duplicate_window_days', value: '7' },
      { key: 'auto_close_hours', value: '48' },
      { key: 'remind_after_hours', value: '24' },
      { key: 'warn_before_hours', value: '12' },
      { key: 'emergency_bypass_to_level', value: '2' }, // Pending client confirmation
      { key: 'chairman_alert_minutes', value: '30' },     // Pending client confirmation
      { key: 'rating_required_before_autoclose', value: 'false' }, // Pending client confirmation
      { key: 'max_evidence', value: '10' },
    ];

    for (const s of defaultSettings) {
      await client.query(`
        INSERT INTO society_setting (society_id, key, value)
        VALUES ($1, $2, $3)
        ON CONFLICT (society_id, key) DO UPDATE SET value = EXCLUDED.value;
      `, [societyId, s.key, s.value]);
    }

    // 11. Seed Working Hours (0 to 6; default enabled=false -> 24x7)
    for (let day = 0; day <= 6; day++) {
      await client.query(`
        INSERT INTO working_hours (society_id, weekday, start_time, end_time, enabled)
        VALUES ($1, $2, '09:00', '18:00', false)
        ON CONFLICT (society_id, weekday) DO NOTHING;
      `, [societyId, day]);
    }

    await client.query('COMMIT');

    console.log('\n========================================================================================');
    console.log('                 GRIEVEASE DEV SEED COMPLETED (NO PASSWORDS SEEDED)                     ');
    console.log('========================================================================================');
    console.log('Activation codes are printed ONCE below. Use these on /activate to initialize accounts:');
    console.table(generatedCredentialsSummary);
    console.log('⚠️  NOTE: No SUPER_ADMIN was seeded. Run `pnpm admin:bootstrap` to setup the first Super Admin.');
    console.log('========================================================================================\n');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ [SEED] Error during seeding:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

export { seed };
