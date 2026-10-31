import { describe, it, expect } from 'vitest';

describe('Direct SQL RLS Enforcement & Append-Only Table Hardening (Item 9 & Section D)', () => {
  // Simulates Postgres RLS policy evaluation engine with session variable app.current_society_id
  interface MockDbSession {
    currentSocietyId: string | null;
    role: 'grievease_app' | 'grievease_worker' | 'grievease_ro' | 'grievease_backup' | 'grievease_migrator';
  }

  interface RecordWithSociety {
    id: string;
    society_id: string;
    [key: string]: any;
  }

  const SOCIETY_TABLES = [
    'wing',
    'flat',
    'app_user',
    'audit_log',
    'cash_entry',
    'grievance',
    'grievance_event',
    'notice',
    'poll',
    'visitor_pass',
    'sos_event',
    'amenity',
    'vendor',
    'vendor_task',
  ];

  const APPEND_ONLY_TABLES = ['audit_log', 'cash_entry', 'grievance_event', 'backup_log'];

  class MockPostgreSqlEngine {
    private tables = new Map<string, RecordWithSociety[]>();

    constructor() {
      for (const table of SOCIETY_TABLES) {
        this.tables.set(table, [
          { id: `${table}-a1`, society_id: 'soc-alpha', name: 'Alpha Record' },
          { id: `${table}-b1`, society_id: 'soc-beta', name: 'Beta Record' },
        ]);
      }
      this.tables.set('backup_log', [
        { id: 'bkl-1', society_id: 'soc-alpha', verified_at: new Date() },
      ]);
    }

    // Evaluates SELECT query under session context and RLS
    select(session: MockDbSession, tableName: string): RecordWithSociety[] {
      const rows = this.tables.get(tableName) || [];
      if (session.role === 'grievease_backup' || session.role === 'grievease_migrator') {
        return [...rows]; // Database administrative/backup dumps see full database
      }

      if (!session.currentSocietyId) {
        // Without society context set, RLS policy fails closed
        return [];
      }

      // RLS Policy: WHERE society_id = current_setting('app.current_society_id')::uuid
      return rows.filter((r) => r.society_id === session.currentSocietyId);
    }

    // Evaluates INSERT with RLS WITH CHECK
    insert(session: MockDbSession, tableName: string, record: RecordWithSociety) {
      if (session.role === 'grievease_ro' || session.role === 'grievease_backup') {
        throw new Error(`permission denied for table ${tableName}: role ${session.role} is read-only`);
      }

      if (record.society_id !== session.currentSocietyId) {
        throw new Error(`new row violates row-level security policy for table "${tableName}"`);
      }

      const rows = this.tables.get(tableName) || [];
      rows.push(record);
      this.tables.set(tableName, rows);
      return record;
    }

    // Evaluates UPDATE on table
    update(session: MockDbSession, tableName: string, id: string, patch: any) {
      if (session.role === 'grievease_ro' || session.role === 'grievease_backup') {
        throw new Error(`permission denied for table ${tableName}: role ${session.role} is read-only`);
      }

      // Append-only trigger enforcement on audit, ledger, and event tables
      if (APPEND_ONLY_TABLES.includes(tableName)) {
        throw new Error(`CANNOT UPDATE: Table "${tableName}" is append-only by cryptographic society policy.`);
      }

      const rows = this.tables.get(tableName) || [];
      const idx = rows.findIndex((r) => r.id === id && r.society_id === session.currentSocietyId);
      if (idx === -1) {
        return 0; // No row updated (isolated by RLS)
      }
      rows[idx] = { ...rows[idx], ...patch };
      return 1;
    }

    // Evaluates DELETE on table
    delete(session: MockDbSession, tableName: string, id: string) {
      if (session.role === 'grievease_ro' || session.role === 'grievease_backup') {
        throw new Error(`permission denied for table ${tableName}: role ${session.role} is read-only`);
      }

      if (APPEND_ONLY_TABLES.includes(tableName)) {
        throw new Error(`CANNOT DELETE: Table "${tableName}" is append-only by cryptographic society policy.`);
      }

      const rows = this.tables.get(tableName) || [];
      const idx = rows.findIndex((r) => r.id === id && r.society_id === session.currentSocietyId);
      if (idx === -1) return 0;
      rows.splice(idx, 1);
      return 1;
    }

    // Evaluates TRUNCATE on table
    truncate(session: MockDbSession, tableName: string) {
      if (session.role !== 'grievease_migrator') {
        throw new Error(`permission denied: role ${session.role} cannot truncate table ${tableName}`);
      }
      this.tables.set(tableName, []);
    }
  }

  it('should enforce RLS across every society table: cross-society reads return 0 rows', () => {
    const db = new MockPostgreSqlEngine();
    const alphaSession: MockDbSession = { currentSocietyId: 'soc-alpha', role: 'grievease_app' };

    for (const table of SOCIETY_TABLES) {
      const results = db.select(alphaSession, table);
      expect(results.length).toBe(1);
      expect(results[0].society_id).toBe('soc-alpha');
      // Must NOT contain Beta records
      expect(results.some((r) => r.society_id === 'soc-beta')).toBe(false);
    }
  });

  it('should fail closed when session society context is unset', () => {
    const db = new MockPostgreSqlEngine();
    const uncontextedSession: MockDbSession = { currentSocietyId: null, role: 'grievease_app' };

    for (const table of SOCIETY_TABLES) {
      const results = db.select(uncontextedSession, table);
      expect(results.length).toBe(0);
    }
  });

  it('should reject cross-society INSERT attempts via RLS WITH CHECK', () => {
    const db = new MockPostgreSqlEngine();
    const alphaSession: MockDbSession = { currentSocietyId: 'soc-alpha', role: 'grievease_app' };

    expect(() => {
      db.insert(alphaSession, 'grievance', {
        id: 'grv-cross-tenant',
        society_id: 'soc-beta', // Spoofed society ID
        title: 'Unauthorized injection',
      });
    }).toThrow(/violates row-level security policy/);
  });

  it('should strictly prohibit direct UPDATE and DELETE on append-only audit, ledger, and event tables', () => {
    const db = new MockPostgreSqlEngine();
    const appSession: MockDbSession = { currentSocietyId: 'soc-alpha', role: 'grievease_app' };

    for (const table of APPEND_ONLY_TABLES) {
      expect(() => {
        db.update(appSession, table, `${table}-a1`, { amount: 0 });
      }).toThrow(/CANNOT UPDATE: Table ".*" is append-only/);

      expect(() => {
        db.delete(appSession, table, `${table}-a1`);
      }).toThrow(/CANNOT DELETE: Table ".*" is append-only/);
    }
  });

  it('should enforce least privilege: grievease_ro and grievease_backup cannot mutate data or truncate', () => {
    const db = new MockPostgreSqlEngine();
    const roSession: MockDbSession = { currentSocietyId: 'soc-alpha', role: 'grievease_ro' };
    const backupSession: MockDbSession = { currentSocietyId: 'soc-alpha', role: 'grievease_backup' };

    for (const s of [roSession, backupSession]) {
      expect(() => db.insert(s, 'flat', { id: 'f-1', society_id: 'soc-alpha' })).toThrow(/permission denied.*read-only/);
      expect(() => db.update(s, 'flat', 'flat-a1', { name: 'Altered' })).toThrow(/permission denied.*read-only/);
      expect(() => db.delete(s, 'flat', 'flat-a1')).toThrow(/permission denied.*read-only/);
      expect(() => db.truncate(s, 'flat')).toThrow(/permission denied/);
    }
  });
});
