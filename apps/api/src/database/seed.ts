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
