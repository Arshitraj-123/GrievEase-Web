import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pool } from '../../apps/api/src/database/db';
import { hashPassword } from '../../apps/api/src/common/utils/password-policy';

function writeLocalCredentialsFile(demoPassword = 'mock_demo_user_password_123!') {
  const credsFile = path.resolve(__dirname, '..', 'credentials.local.md');
  const credsContent = `# GrievEase Demo Credentials (Local Only - Excluded from Pack)

> **DO NOT COMMIT OR DISTRIBUTE THIS FILE**  
> Password for all seeded demo accounts: \`${demoPassword}\`

| Role | Username | Flat | Password | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | \`admin.super\` | None | \`${demoPassword}\` | Global setup, admin handover, statutory reveal |
| **Chairman** | \`chairman.gvr\` | B-502 | \`${demoPassword}\` | Escalation override, checker approvals |
| **Secretary** | \`secretary.gvr\` | A-101 | \`${demoPassword}\` | Grievance resolution, cash collection, notices |
| **Committee** | \`committee1.gvr\` | A-201 | \`${demoPassword}\` | Level 2 escalations, waiver reviews |
| **Governing Body** | \`governing.gvr\` | B-401 | \`${demoPassword}\` | Level 4 review, audit trail inspection |
| **Resident 1** | \`resident.rohan\` | A-102 | \`${demoPassword}\` | File complaints, visitor passes, SOS |
| **Resident 2** | \`resident.priya\` | B-201 | \`${demoPassword}\` | Second resident, poll voting, bookings |
| **Guard** | \`guard.main\` | Gate Terminal | \`${demoPassword}\` | Gatehouse console, visitor QR check-in |
| **Vendor** | \`vendor.spark\` | Contractor Portal | \`${demoPassword}\` | Task dashboard, photo proofs |
`;
  fs.writeFileSync(credsFile, credsContent, 'utf-8');
  console.log(`📄 Demo credentials reference written to: ${credsFile}`);
}

export async function runDemoSeed() {
  // 1. SAFETY CHECKS
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: Refusing to run demo seed when NODE_ENV=production!');
  }

  const isDemo = process.env.DEMO_MODE === 'true';
  const dbUrl = process.env.DATABASE_URL || '';
  const isDemoDb = dbUrl.includes('_demo') || process.env.ALLOW_DEMO_SEED_ON_DEV === 'true';

  if (!isDemo || !isDemoDb) {
    throw new Error(
      `FATAL: Demo seed refused. Requires DEMO_MODE=true and database name ending with '_demo' (or ALLOW_DEMO_SEED_ON_DEV=true). Current DB: ${dbUrl}`
    );
  }

  console.log('🌱 Initializing GrievEase Deterministic Demo Database Seed...');
  let client;
  try {
    client = await pool.connect();
  } catch (connErr: any) {
    console.warn(`⚠️ PostgreSQL connection to ${dbUrl} failed (${connErr.message}). Writing local demo credentials and continuing in offline test mode.`);
    writeLocalCredentialsFile('mock_demo_user_password_123!');
    return;
  }

  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.is_super_admin', 'true', true)");

    // 2. Society Creation
    const societyRes = await client.query(`
      INSERT INTO society (name, code, address, city, state, pincode)
      VALUES ('Green Valley Residency', 'GVR', 'Plot 42, Palm Avenue, Sector 5', 'Navi Mumbai', 'Maharashtra', '400705')
      ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name, code;
    `);
    const societyId = societyRes.rows[0].id;

    // 3. Wings A and B
    const wingARes = await client.query(`
      INSERT INTO wing (society_id, name, total_floors, flats_per_floor)
      VALUES ($1, 'A', 5, 2)
      ON CONFLICT (society_id, name) DO UPDATE SET total_floors = 5
      RETURNING id, name;
    `, [societyId]);
    const wingBRes = await client.query(`
      INSERT INTO wing (society_id, name, total_floors, flats_per_floor)
      VALUES ($1, 'B', 5, 2)
      ON CONFLICT (society_id, name) DO UPDATE SET total_floors = 5
      RETURNING id, name;
    `, [societyId]);

    const wingAId = wingARes.rows[0].id;
    const wingBId = wingBRes.rows[0].id;

    // 4. Flats
    const flats: Record<string, string> = {};
    for (let floor = 1; floor <= 5; floor++) {
      for (const flatNum of [1, 2]) {
        const numA = `A-${floor}0${flatNum}`;
        const resA = await client.query(`
          INSERT INTO flat (society_id, wing_id, flat_number, floor)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (society_id, flat_number) DO UPDATE SET floor = EXCLUDED.floor
          RETURNING id, flat_number;
        `, [societyId, wingAId, numA, floor]);
        flats[numA] = resA.rows[0].id;

        const numB = `B-${floor}0${flatNum}`;
        const resB = await client.query(`
          INSERT INTO flat (society_id, wing_id, flat_number, floor)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (society_id, flat_number) DO UPDATE SET floor = EXCLUDED.floor
          RETURNING id, flat_number;
        `, [societyId, wingBId, numB, floor]);
        flats[numB] = resB.rows[0].id;
      }
    }

    // 5. Canonical Demo Users & Passwords
    const demoPassword = 'mock_demo_user_password_123!';
    const passwordHash = await hashPassword(demoPassword);

    const users = [
      { role: 'SUPER_ADMIN', username: 'admin.super', fullName: 'Vikramaditya Rao', email: 'admin@greenvalley.local', flatId: null, mobile: '+919999900001' },
      { role: 'CHAIRMAN', username: 'chairman.gvr', fullName: 'Vikram Malhotra', email: 'chairman@greenvalley.local', flatId: flats['B-502'], mobile: '+919999900002' },
      { role: 'SECRETARY', username: 'secretary.gvr', fullName: 'Rajesh Sharma', email: 'secretary@greenvalley.local', flatId: flats['A-101'], mobile: '+919999900003' },
      { role: 'COMMITTEE', username: 'committee1.gvr', fullName: 'Ananya Deshmukh', email: 'committee@greenvalley.local', flatId: flats['A-201'], mobile: '+919999900004' },
      { role: 'GOVERNING_BODY', username: 'governing.gvr', fullName: 'Col. Sanjeev Nair', email: 'governing@greenvalley.local', flatId: flats['B-401'], mobile: '+919999900005' },
      { role: 'RESIDENT', username: 'resident.rohan', fullName: 'Rohan Mehra', email: 'rohan@example.local', flatId: flats['A-102'], mobile: '+919999900006' },
      { role: 'RESIDENT', username: 'resident.priya', fullName: 'Priya Sharma', email: 'priya@example.local', flatId: flats['B-201'], mobile: '+919999900007' },
      { role: 'GUARD', username: 'guard.main', fullName: 'Ramesh Yadav', email: null, flatId: null, mobile: '+919999900008' },
      { role: 'VENDOR', username: 'vendor.spark', fullName: 'Suresh Electrician', email: null, flatId: null, mobile: '+919999900009' },
    ];

    const userIds: Record<string, string> = {};

    for (const u of users) {
      const uRes = await client.query(`
        INSERT INTO app_user (
          society_id, flat_id, username, password_hash, full_name, email, mobile,
          role, status, must_change_password
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE', false)
        ON CONFLICT (username) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          status = 'ACTIVE'
        RETURNING id, username;
      `, [societyId, u.flatId, u.username, passwordHash, u.fullName, u.email, u.mobile, u.role]);

      userIds[u.username] = uRes.rows[0].id;
    }

    // 6. Bootstrap State sealed
    await client.query(`
      INSERT INTO bootstrap_state (id, setup_completed_at, setup_token_hash)
      VALUES (1, NOW(), NULL)
      ON CONFLICT (id) DO UPDATE SET setup_completed_at = NOW(), setup_token_hash = NULL;
    `);

    // 7. Grievance Categories (EN + HI)
    const categories = [
      { name_en: 'Water Supply', name_hi: 'पानी की आपूर्ति', icon: 'Droplets' },
      { name_en: 'Electricity & Power', name_hi: 'बिजली और बिजली आपूर्ति', icon: 'Zap' },
      { name_en: 'Cleanliness & Waste', name_hi: 'सफाई और कचरा प्रबंधन', icon: 'Trash2' },
      { name_en: 'Security & Safety', name_hi: 'सुरक्षा और बचाव', icon: 'Shield' },
      { name_en: 'Lift & Elevator', name_hi: 'लिफ्ट और एलिवेटर', icon: 'ArrowUpDown' },
      { name_en: 'Clubhouse & Garden', name_hi: 'क्लबहाउस और उद्यान', icon: 'Trees' },
    ];

    const categoryIds: Record<string, string> = {};
    for (const cat of categories) {
      const cRes = await client.query(`
        INSERT INTO grievance_category (society_id, name_en, name_hi, icon)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (society_id, name_en) DO UPDATE SET name_hi = EXCLUDED.name_hi
        RETURNING id, name_en;
      `, [societyId, cat.name_en, cat.name_hi, cat.icon]);
      categoryIds[cat.name_en] = cRes.rows[0].id;
    }

    // 8. Default Governance Chain & SLA
    for (let lvl = 1; lvl <= 4; lvl++) {
      await client.query(`
        INSERT INTO governance_chain (society_id, level, role_name, escalation_timeout_hours)
        VALUES ($1, $2, $3, 24)
        ON CONFLICT (society_id, level) DO UPDATE SET escalation_timeout_hours = 24;
      `, [societyId, lvl, ['SECRETARY', 'COMMITTEE', 'CHAIRMAN', 'GOVERNING_BODY'][lvl - 1]]);
    }

    // 9. Sample Grievances across levels
    const sampleGrievances = [
      {
        publicId: 'GRV-2026-001',
        title: 'Corridor Light Flickering near Flat A-102',
        cat: categoryIds['Electricity & Power'],
        level: 1,
        status: 'SUBMITTED',
        user: userIds['resident.rohan'],
        flat: flats['A-102'],
        isAnon: false,
      },
      {
        publicId: 'GRV-2026-002',
        title: 'Main Overhead Tank Valve Leakage',
        cat: categoryIds['Water Supply'],
        level: 2,
        status: 'ESCALATED',
        user: userIds['resident.priya'],
        flat: flats['B-201'],
        isAnon: false,
      },
      {
        publicId: 'GRV-2026-003',
        title: 'Unattended waste dumped in staircase B',
        cat: categoryIds['Cleanliness & Waste'],
        level: 1,
        status: 'SUBMITTED',
        user: null,
        flat: null,
        isAnon: true,
      },
    ];

    for (const g of sampleGrievances) {
      await client.query(`
        INSERT INTO grievance (
          society_id, flat_id, created_by_id, category_id, public_id, title,
          description, current_level, status, is_anonymous, sla_due_at, tracking_code
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'Sample description for demo walkthrough.', $7, $8, $9, NOW() + INTERVAL '24 hours', 'TRK99281')
        ON CONFLICT (public_id) DO UPDATE SET status = EXCLUDED.status;
      `, [societyId, g.flat, g.user, g.cat, g.publicId, g.title, g.level, g.status, g.isAnon]);
    }

    // 10. Sample Emergency Notice & Poll
    await client.query(`
      INSERT INTO notice (society_id, title_en, title_hi, body_en, body_hi, priority, published_at)
      VALUES (
        $1,
        'EMERGENCY: Scheduled Water Tank Cleaning at 4:00 PM',
        'आपातकालीन: शाम 4:00 बजे पानी की टंकी की सफाई',
        'Water supply will be paused between 4:00 PM and 7:00 PM for annual cleaning.',
        'वार्षिक सफाई के लिए शाम 4:00 बजे से 7:00 बजे तक पानी की आपूर्ति बाधित रहेगी।',
        'EMERGENCY',
        NOW()
      );
    `, [societyId]);

    await client.query(`
      INSERT INTO poll (society_id, title_en, title_hi, question_en, question_hi, options, status, expires_at)
      VALUES (
        $1,
        'Annual Cultural Festival Date',
        'वार्षिक सांस्कृतिक उत्सव की तिथि',
        'Which weekend suits your family best for the cultural festival?',
        'सांस्कृतिक उत्सव के लिए आपके परिवार के लिए कौन सा सप्ताहांत सबसे उपयुक्त है?',
        '[{"id":"opt1","text_en":"Nov 14-15","text_hi":"14-15 नवंबर","votes":12},{"id":"opt2","text_en":"Nov 21-22","text_hi":"21-22 नवंबर","votes":18}]'::jsonb,
        'ACTIVE',
        NOW() + INTERVAL '7 days'
      );
    `, [societyId]);

    // 11. Sample Amenities
    await client.query(`
      INSERT INTO amenity (society_id, name_en, name_hi, fee_per_hour, max_hours, is_active)
      VALUES
        ($1, 'Clubhouse Community Hall', 'क्लबहाउस सामुदायिक हॉल', 500, 4, true),
        ($1, 'Tennis & Badminton Court', 'टेनिस और बैडमिंटन कोर्ट', 200, 2, true)
      ON CONFLICT DO NOTHING;
    `, [societyId]);

    await client.query('COMMIT');
    console.log('✅ Demo Database Seed Completed Successfully!');

    // 12. Write git-ignored credentials.local.md for demo runner reference
    writeLocalCredentialsFile(demoPassword);
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ Demo seed failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runDemoSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
