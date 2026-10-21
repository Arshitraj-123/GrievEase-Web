import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  bigint,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ==========================================
// 1. SOCIETY & PROPERTY STRUCTURE
// ==========================================
export const societies = pgTable('society', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  address: text('address').notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  pincode: varchar('pincode', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const wings = pgTable('wing', {
  id: uuid('id').defaultRandom().primaryKey(),
  societyId: uuid('society_id')
    .notNull()
    .references(() => societies.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 20 }).notNull(),
  totalFloors: integer('total_floors').notNull().default(1),
  flatsPerFloor: integer('flats_per_floor').notNull().default(4),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const flats = pgTable('flat', {
  id: uuid('id').defaultRandom().primaryKey(),
  societyId: uuid('society_id')
    .notNull()
    .references(() => societies.id, { onDelete: 'cascade' }),
  wingId: uuid('wing_id')
    .notNull()
    .references(() => wings.id, { onDelete: 'cascade' }),
  flatNumber: varchar('flat_number', { length: 20 }).notNull(),
  floor: integer('floor').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 2. USER IDENTITY & AUTHENTICATION
// ==========================================
export const appUsers = pgTable(
  'app_user',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    societyId: uuid('society_id')
      .notNull()
      .references(() => societies.id, { onDelete: 'cascade' }),
    flatId: uuid('flat_id').references(() => flats.id, { onDelete: 'set null' }),
    memberId: varchar('member_id', { length: 50 }).notNull(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    fullName: varchar('full_name', { length: 100 }).notNull(),
    mobile: varchar('mobile', { length: 20 }).notNull(),
    email: varchar('email', { length: 150 }),
    role: varchar('role', { length: 50 }).notNull().default('RESIDENT'),
    status: varchar('status', { length: 20 }).notNull().default('INVITED'),
    passwordHash: text('password_hash'),
    mustChangePassword: boolean('must_change_password').notNull().default(true),
    passwordChangedAt: timestamp('password_changed_at'),
    language: varchar('language', { length: 10 }).notNull().default('en'),
    fontSize: varchar('font_size', { length: 20 }).notNull().default('normal'),
    directoryVisible: boolean('directory_visible').notNull().default(false),
    failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
    lockedUntil: timestamp('locked_until'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('unique_member_id_per_society').on(table.societyId, table.memberId),
    uniqueIndex('one_active_super_admin')
      .on(table.role)
      .where(sql`role = 'SUPER_ADMIN' AND status = 'ACTIVE'`),
  ]
);

export const activationCodes = pgTable('activation_code', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => appUsers.id, { onDelete: 'cascade' }),
  codeHash: text('code_hash').notNull(),
  verifyDetailHash: text('verify_detail_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  attempts: integer('attempts').notNull().default(0),
  consumedAt: timestamp('consumed_at'),
  issuedBy: uuid('issued_by').references(() => appUsers.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const recoveryCodes = pgTable('recovery_code', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => appUsers.id, { onDelete: 'cascade' }),
  codeHash: text('code_hash').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const securityQuestions = pgTable('security_question', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => appUsers.id, { onDelete: 'cascade' }),
  questionText: text('question_text').notNull(),
  answerHash: text('answer_hash').notNull(),
  ordinal: integer('ordinal').notNull(), // 1, 2, or 3
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const passwordResetTickets = pgTable('password_reset_ticket', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => appUsers.id, { onDelete: 'cascade' }),
  ticketHash: text('ticket_hash').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  eligibleAt: timestamp('eligible_at').notNull(), // cooling off delay
  usedAt: timestamp('used_at'),
  deviceFingerprint: text('device_fingerprint'),
  ip: text('ip'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const totpSecrets = pgTable('totp_secret', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => appUsers.id, { onDelete: 'cascade' })
    .unique(),
  encryptedSecret: text('encrypted_secret').notNull(),
  enabledAt: timestamp('enabled_at').defaultNow().notNull(),
});

export const totpBackupCodes = pgTable('totp_backup_code', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => appUsers.id, { onDelete: 'cascade' }),
  codeHash: text('code_hash').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const deviceSessions = pgTable('device_session', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => appUsers.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  familyId: uuid('family_id').notNull(),
  deviceLabel: text('device_label'),
  ip: text('ip'),
  userAgent: text('user_agent'),
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 3. BULK IMPORT MANAGEMENT
// ==========================================
export const importBatches = pgTable('import_batch', {
  id: uuid('id').defaultRandom().primaryKey(),
  societyId: uuid('society_id')
    .notNull()
    .references(() => societies.id, { onDelete: 'cascade' }),
  uploadedBy: uuid('uploaded_by')
    .notNull()
    .references(() => appUsers.id, { onDelete: 'cascade' }),
  fileSha256: varchar('file_sha256', { length: 64 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('PREVIEW'),
  counts: jsonb('counts').notNull(), // { total, valid, invalid, duplicates, committed }
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const importRows = pgTable('import_row', {
  id: uuid('id').defaultRandom().primaryKey(),
  batchId: uuid('batch_id')
    .notNull()
    .references(() => importBatches.id, { onDelete: 'cascade' }),
  rowNo: integer('row_no').notNull(),
  raw: jsonb('raw').notNull(),
  errors: jsonb('errors'),
  createdUserId: uuid('created_user_id').references(() => appUsers.id, { onDelete: 'set null' }),
});

// ==========================================
// 4. SUPER ADMIN GOVERNANCE & HANDOVER
// ==========================================
export const superAdminTransfers = pgTable('super_admin_transfer', {
  id: uuid('id').defaultRandom().primaryKey(),
  fromUser: uuid('from_user')
    .notNull()
    .references(() => appUsers.id, { onDelete: 'cascade' }),
  toUser: uuid('to_user')
    .notNull()
    .references(() => appUsers.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const bootstrapStates = pgTable('bootstrap_state', {
  id: integer('id').primaryKey().default(1),
  setupTokenHash: text('setup_token_hash'),
  setupTokenExpiresAt: timestamp('setup_token_expires_at'),
  setupCompletedAt: timestamp('setup_completed_at'),
});

// ==========================================
// 5. HASH-CHAINED IMMUTABLE AUDIT LOG
// ==========================================
export const auditLogs = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  societyId: uuid('society_id')
    .notNull()
    .references(() => societies.id, { onDelete: 'cascade' }),
  seq: bigint('seq', { mode: 'number' }).notNull(),
  actorId: uuid('actor_id').references(() => appUsers.id, { onDelete: 'set null' }),
  actorRole: varchar('actor_role', { length: 50 }),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 100 }),
  before: jsonb('before'),
  after: jsonb('after'),
  ip: varchar('ip', { length: 50 }),
  device: varchar('device', { length: 255 }),
  prevHash: varchar('prev_hash', { length: 64 }).notNull(),
  hash: varchar('hash', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// 6. IN-APP NOTIFICATIONS
// ==========================================
export const inAppNotifications = pgTable('in_app_notification', {
  id: uuid('id').defaultRandom().primaryKey(),
  societyId: uuid('society_id')
    .notNull()
    .references(() => societies.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => appUsers.id, { onDelete: 'cascade' }),
  targetRole: varchar('target_role', { length: 50 }),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 20 }).notNull().default('INFO'),
  link: varchar('link', { length: 255 }),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
