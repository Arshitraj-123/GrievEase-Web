import { z } from 'zod';

// ==========================================
// 1. ROLES & STATUSES
// ==========================================
export const RoleEnum = z.enum([
  'RESIDENT',
  'SECRETARY',
  'COMMITTEE',
  'CHAIRMAN',
  'GOVERNING_BODY',
  'SUPER_ADMIN',
  'GUARD',
  'VENDOR',
]);
export type Role = z.infer<typeof RoleEnum>;

export const ADMIN_ROLES: Role[] = [
  'SECRETARY',
  'COMMITTEE',
  'CHAIRMAN',
  'GOVERNING_BODY',
  'SUPER_ADMIN',
];

export const isAdminRole = (role: Role): boolean => ADMIN_ROLES.includes(role);

export const UserStatusEnum = z.enum(['INVITED', 'ACTIVE', 'LOCKED', 'DISABLED']);
export type UserStatus = z.infer<typeof UserStatusEnum>;

export const ImportBatchStatusEnum = z.enum(['PREVIEW', 'COMMITTED', 'ROLLED_BACK']);
export type ImportBatchStatus = z.infer<typeof ImportBatchStatusEnum>;

export const ResetTicketStatusEnum = z.enum(['PENDING', 'CANCELLED', 'USED']);
export type ResetTicketStatus = z.infer<typeof ResetTicketStatusEnum>;

export const SuperAdminTransferStatusEnum = z.enum([
  'PENDING',
  'ACCEPTED',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
]);
export type SuperAdminTransferStatus = z.infer<typeof SuperAdminTransferStatusEnum>;

// ==========================================
// 2. AUTH CONTRACTS
// ==========================================
export const LoginSchema = z.object({
  username: z.string().min(3).max(100),
  password: z.string().min(1),
  challengeNonce: z.string().optional(),
  challengeSolution: z.string().optional(),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const ChallengeResponseSchema = z.object({
  required: z.boolean(),
  nonce: z.string(),
  difficulty: z.number(),
  expiresAt: z.number(),
});
export type ChallengeResponse = z.infer<typeof ChallengeResponseSchema>;

export const ActivateSchema = z.object({
  username: z.string().min(3),
  activationCode: z
    .string()
    .length(10, 'Activation code must be exactly 10 characters')
    .regex(/^[2-9A-HJ-NP-Z]{10}$/i, 'Invalid activation code format'),
  verifyDetail: z.string().min(1, 'Verification detail is required (Flat number or DOB)'),
});
export type ActivateDto = z.infer<typeof ActivateSchema>;

export const SetInitialPasswordSchema = z.object({
  activationToken: z.string().min(10),
  newPassword: z.string().min(10),
  confirmPassword: z.string().min(10),
});
export type SetInitialPasswordDto = z.infer<typeof SetInitialPasswordSchema>;

export const SetupSecurityQuestionsSchema = z.object({
  activationToken: z.string().min(10),
  questions: z
    .array(
      z.object({
        ordinal: z.number().int().min(1).max(3),
        questionText: z.string().min(10).max(150),
        answer: z.string().min(6).max(100),
      })
    )
    .length(3, 'Exactly 3 security questions must be provided'),
});
export type SetupSecurityQuestionsDto = z.infer<typeof SetupSecurityQuestionsSchema>;

export const EnrolTotpSchema = z.object({
  totpToken: z.string(),
  code: z.string().length(6),
});
export type EnrolTotpDto = z.infer<typeof EnrolTotpSchema>;

export const Verify2faSchema = z.object({
  tempToken: z.string(),
  code: z.string().min(6).max(8), // 6-digit TOTP or 8-char backup code
});
export type Verify2faDto = z.infer<typeof Verify2faSchema>;

export const StepUpSchema = z.object({
  password: z.string().min(1),
  totpCode: z.string().length(6).optional(),
});
export type StepUpDto = z.infer<typeof StepUpSchema>;

export const RecoveryStartSchema = z.object({
  username: z.string().min(3),
});
export type RecoveryStartDto = z.infer<typeof RecoveryStartSchema>;

export const RecoveryAnswerSchema = z.object({
  username: z.string().min(3),
  answers: z
    .array(
      z.object({
        ordinal: z.number().int().min(1).max(3),
        answer: z.string().min(1),
      })
    )
    .length(3),
});
export type RecoveryAnswerDto = z.infer<typeof RecoveryAnswerSchema>;

export const RecoveryCodeResetSchema = z.object({
  username: z.string().min(3),
  recoveryCode: z.string().min(8).max(20),
  newPassword: z.string().min(10),
});
export type RecoveryCodeResetDto = z.infer<typeof RecoveryCodeResetSchema>;

export const PasswordResetWithTicketSchema = z.object({
  ticketToken: z.string().min(10),
  newPassword: z.string().min(10),
});
export type PasswordResetWithTicketDto = z.infer<typeof PasswordResetWithTicketSchema>;

export const SetupFirstAdminSchema = z.object({
  setupToken: z.string().length(64),
  name: z.string().min(2).max(100),
  username: z.string().min(3).max(50),
  password: z.string().min(12),
});
export type SetupFirstAdminDto = z.infer<typeof SetupFirstAdminSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10),
});
export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

// ==========================================
// 3. USER MANAGEMENT & IMPORT
// ==========================================
export const CreateUserSchema = z.object({
  fullName: z.string().min(2).max(100),
  username: z.string().min(3).max(50).optional(),
  mobile: z.string().regex(/^[0-9+ -]{10,15}$/, 'Invalid mobile phone'),
  email: z.string().email().optional().nullable(),
  role: RoleEnum,
  wing: z.string().min(1).max(20),
  flat: z.string().min(1).max(20),
  verifyDetail: z.string().min(1).max(100), // Flat or DOB
  directoryVisible: z.boolean().default(false),
});
export type CreateUserDto = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  mobile: z.string().regex(/^[0-9+ -]{10,15}$/).optional(),
  email: z.string().email().optional().nullable(),
  status: UserStatusEnum.optional(),
  directoryVisible: z.boolean().optional(),
});
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;

export const ChangeRoleSchema = z.object({
  newRole: RoleEnum,
});
export type ChangeRoleDto = z.infer<typeof ChangeRoleSchema>;

export const SuperAdminNominateSchema = z.object({
  nomineeUserId: z.string().uuid(),
});
export type SuperAdminNominateDto = z.infer<typeof SuperAdminNominateSchema>;

export const SuperAdminConfirmSchema = z.object({
  transferId: z.string().uuid(),
  demotedRole: RoleEnum.default('RESIDENT'),
});
export type SuperAdminConfirmDto = z.infer<typeof SuperAdminConfirmSchema>;

// ==========================================
// 4. AUDIT & TELEMETRY CONTRACTS
// ==========================================
export interface AuditLogItem {
  id: string;
  societyId: string;
  seq: number;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
  device: string | null;
  prevHash: string;
  hash: string;
  createdAt: string;
}

export interface ChainVerificationResult {
  societyId: string;
  verified: boolean;
  totalBlocks: number;
  tamperedBlockSeq?: number;
  latestHash: string;
  timestamp: string;
}

// ==========================================
// 5. IN-APP NOTIFICATIONS
// ==========================================
export interface InAppNotification {
  id: string;
  societyId: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  link?: string;
  read: boolean;
  createdAt: string;
}

// ==========================================
// 6. STANDARD API RESPONSE WRAPPER
// ==========================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    referenceId?: string;
  };
}
