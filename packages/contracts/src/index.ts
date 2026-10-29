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

// ==========================================
// 7. PHASE 3: GRIEVANCE ENUMS & CONTRACTS
// ==========================================
export const GrievanceStatusEnum = z.enum([
  'DRAFT',
  'SUBMITTED',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'PENDING_INFO',
  'ESCALATED',
  'RESOLVED',
  'REOPENED',
  'CLOSED',
]);
export type GrievanceStatus = z.infer<typeof GrievanceStatusEnum>;

export const GrievancePriorityEnum = z.enum(['NORMAL', 'URGENT', 'EMERGENCY']);
export type GrievancePriority = z.infer<typeof GrievancePriorityEnum>;

export const EscalationReasonEnum = z.enum([
  'AUTO_SLA',
  'MANUAL',
  'LEAVE',
  'VACANT',
  'EMERGENCY',
  'APPEAL',
]);
export type EscalationReason = z.infer<typeof EscalationReasonEnum>;

export const EventVisibilityEnum = z.enum(['RESIDENT', 'INTERNAL']);
export type EventVisibility = z.infer<typeof EventVisibilityEnum>;

export const CreateGrievanceSchema = z.object({
  title: z
    .string()
    .min(10, 'Title must be at least 10 characters')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(1, 'Description is required'),
  categoryId: z.string().uuid('Valid category is required'),
  priority: GrievancePriorityEnum.default('NORMAL'),
  areaText: z.string().max(255).optional(),
  areaTagId: z.string().uuid().optional(),
  occurredAt: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  coComplainants: z.array(z.string().uuid()).max(5).optional(),
  evidenceKeys: z.array(z.string()).max(10).optional(),
  confirmDuplicate: z.boolean().default(false),
});
export type CreateGrievanceDto = z.infer<typeof CreateGrievanceSchema>;

export const UpdateGrievanceStatusSchema = z.object({
  status: GrievanceStatusEnum,
  closureNote: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
});
export type UpdateGrievanceStatusDto = z.infer<typeof UpdateGrievanceStatusSchema>;

export const AddGrievanceNoteSchema = z.object({
  note: z.string().min(1, 'Note content cannot be empty'),
  isInternal: z.boolean().default(false),
});
export type AddGrievanceNoteDto = z.infer<typeof AddGrievanceNoteSchema>;

export const RequestInfoSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters'),
});
export type RequestInfoDto = z.infer<typeof RequestInfoSchema>;

export const ManualEscalateSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});
export type ManualEscalateDto = z.infer<typeof ManualEscalateSchema>;

export const GrievanceAppealSchema = z.object({
  reason: z.string().min(10, 'Appeal reason must be at least 10 characters'),
});
export type GrievanceAppealDto = z.infer<typeof GrievanceAppealSchema>;

export const GrievanceRateSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(200).optional(),
  tags: z.array(z.string()).max(5).optional(),
});
export type GrievanceRateDto = z.infer<typeof GrievanceRateSchema>;

export const GrievanceFlagSchema = z.object({
  flagged: z.boolean(),
  reason: z.string().min(5, 'Flag reason required'),
});
export type GrievanceFlagDto = z.infer<typeof GrievanceFlagSchema>;

export const GrievanceAssignSchema = z.object({
  assignedTo: z.string().uuid('Valid user ID required'),
  reason: z.string().optional(),
});
export type GrievanceAssignDto = z.infer<typeof GrievanceAssignSchema>;

export const RevealIdentitySchema = z.object({
  reason: z
    .string()
    .min(30, 'Reason must be at least 30 characters for security auditing'),
});
export type RevealIdentityDto = z.infer<typeof RevealIdentitySchema>;

export const CreateOnBehalfSchema = z.object({
  residentUserId: z.string().uuid(),
  title: z.string().min(10).max(100),
  description: z.string().min(1),
  categoryId: z.string().uuid(),
  priority: GrievancePriorityEnum.default('NORMAL'),
  areaText: z.string().optional(),
  areaTagId: z.string().uuid().optional(),
  evidenceKeys: z.array(z.string()).max(10).optional(),
});
export type CreateOnBehalfDto = z.infer<typeof CreateOnBehalfSchema>;

// Category
export const CategorySchema = z.object({
  id: z.string().uuid().optional(),
  nameEn: z.string().min(2).max(100),
  nameHi: z.string().min(2).max(100),
  nameMr: z.string().min(2).max(100),
  icon: z.string().min(1).max(50),
  requiresPhoto: z.boolean().default(false),
  sort: z.number().int().default(0),
  active: z.boolean().default(true),
});
export type CategoryDto = z.infer<typeof CategorySchema>;

// Area Tag
export const AreaTagSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(100),
  qrSlug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
});
export type AreaTagDto = z.infer<typeof AreaTagSchema>;

// SLA Config
export const SlaConfigSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  priority: GrievancePriorityEnum,
  level: z.number().int().min(1).max(4),
  hours: z.number().int().min(1).max(720),
});
export type SlaConfigDto = z.infer<typeof SlaConfigSchema>;

// Governance Assignment
export const GovernanceAssignmentSchema = z.object({
  level: z.number().int().min(1).max(4),
  userId: z.string().uuid(),
  isPrimary: z.boolean().default(false),
});
export type GovernanceAssignmentDto = z.infer<typeof GovernanceAssignmentSchema>;

// Resolver Leave
export const ResolverLeaveSchema = z.object({
  userId: z.string().uuid(),
  fromAt: z.string(),
  toAt: z.string(),
  reason: z.string().min(5),
});
export type ResolverLeaveDto = z.infer<typeof ResolverLeaveSchema>;

// Working Hours Day
export const WorkingHoursDaySchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  enabled: z.boolean(),
});
export type WorkingHoursDayDto = z.infer<typeof WorkingHoursDaySchema>;

// Society Settings
export const SocietySettingsSchema = z.object({
  rateLimitPer24h: z.number().int().min(1).max(50).default(5),
  duplicateWindowDays: z.number().int().min(1).max(30).default(7),
  autoCloseHours: z.number().int().min(1).max(168).default(48),
  remindAfterHours: z.number().int().min(1).max(168).default(24),
  warnBeforeHours: z.number().int().min(1).max(48).default(12),
  emergencyBypassToLevel: z.number().int().min(1).max(4).default(2),
  chairmanAlertMinutes: z.number().int().min(5).max(1440).default(30),
  ratingRequiredBeforeAutoclose: z.boolean().default(false),
  maxEvidence: z.number().int().min(1).max(20).default(10),
});
export type SocietySettingsDto = z.infer<typeof SocietySettingsSchema>;

// ==========================================
// 8. PHASE 4: ANALYTICS, TRANSPARENCY & REPORTING
// ==========================================

export const AnalyticsRangeEnum = z.enum(['30d', '90d', '12m']);
export type AnalyticsRange = z.infer<typeof AnalyticsRangeEnum>;

export const AnalyticsFilterSchema = z.object({
  range: AnalyticsRangeEnum.default('30d'),
  categoryId: z.string().uuid().optional(),
  priority: GrievancePriorityEnum.optional(),
  wingId: z.string().uuid().optional(),
  level: z.coerce.number().int().min(1).max(4).optional(),
});
export type AnalyticsFilterDto = z.infer<typeof AnalyticsFilterSchema>;

export const PublicDashboardVisibilityEnum = z.enum(['PUBLIC', 'RESIDENTS_ONLY']);
export type PublicDashboardVisibility = z.infer<typeof PublicDashboardVisibilityEnum>;

export const AnalyticsSettingsSchema = z.object({
  publicDashboardEnabled: z.boolean().default(true),
  publicDashboardVisibility: PublicDashboardVisibilityEnum.default('RESIDENTS_ONLY'),
  minCellSize: z.coerce.number().int().min(1).max(50).default(5),
  perfThresholdExcellent: z.coerce.number().int().min(50).max(100).default(90),
  perfThresholdOnTrack: z.coerce.number().int().min(30).max(95).default(75),
});
export type AnalyticsSettingsDto = z.infer<typeof AnalyticsSettingsSchema>;

export interface PublicDashboardStatsDto {
  societyName: string;
  societySlug: string;
  summaryCards: {
    openLoad: number;
    resolvedCount: number;
    avgResolutionHours: number;
    satisfactionScore: number | null;
    ratedCount: number;
    escalationRate: number;
  };
  statusSplit: {
    status: GrievanceStatus;
    count: number;
  }[];
  resolutionByCategory: {
    categoryId: string;
    categoryName: string;
    resolvedCount: number;
    avgHours: number;
  }[];
  averageTimePerLevel: {
    level: number;
    avgMinutes: number;
    avgHours: number;
    count: number;
  }[];
  satisfaction: {
    score: number | null;
    count: number;
    breakdown: { stars: number; count: number }[];
  };
  twelveMonthTrend: {
    month: string;
    submitted: number;
    resolved: number;
  }[];
  topRecurringIssues: {
    categoryName: string;
    areaTagName: string;
    count: number;
  }[];
  suppressed: boolean;
  lastUpdated: string;
}

export interface LandingStatsDto {
  resolvedThisMonth: number;
  averageResolutionHours: number;
  satisfactionScore: number;
  ratingCount: number;
  societyName: string;
}

export interface ResidentAnalyticsDto extends PublicDashboardStatsDto {
  slaComplianceByLevel: {
    level: number;
    complianceRate: number;
    totalHandled: number;
  }[];
}

export interface AdminAnalyticsDto {
  kpis: {
    totalSubmitted: number;
    openLoad: number;
    resolvedCount: number;
    avgResolutionHours: number;
    slaComplianceRate: number;
    satisfactionScore: number | null;
    appealsCount: number;
    reopensCount: number;
  };
  trend: {
    date: string;
    submitted: number;
    resolved: number;
    escalated: number;
  }[];
  categoryMix: {
    categoryId: string;
    categoryName: string;
    count: number;
    percentage: number;
  }[];
  priorityMix: {
    priority: string;
    count: number;
  }[];
  agingBuckets: {
    zeroToOneDays: number;
    oneToThreeDays: number;
    threeToSevenDays: number;
    sevenPlusDays: number;
  };
  wingHeatmap: {
    wingId: string;
    wingName: string;
    categoryId: string;
    categoryName: string;
    count: number;
    isSuppressed: boolean;
    displayValue: string;
  }[];
  levelFunnel: {
    level: number;
    levelName: string;
    enteredCount: number;
    resolvedCount: number;
    escalatedOutCount: number;
    avgMinutes: number;
  }[];
  finalLevelOverdue: {
    id: string;
    publicId: string;
    title: string;
    categoryName: string;
    priority: string;
    hoursOverdue: number;
    slaDueAt: string;
  }[];
}

export type ResolverPerformanceLabel =
  | 'Excellent'
  | 'On track'
  | 'Needs support'
  | 'Not enough data (<5 closed)';

export interface ResolverSummaryDto {
  userId: string;
  fullName: string;
  level: number;
  levelName: string;
  assigned: number;
  resolved: number;
  acknowledgedWithinSlaRate: number;
  avgAckMinutes: number;
  avgResolutionMinutes: number;
  slaHitRate: number | null;
  breachesWhileAssigned: number;
  reopenRate: number;
  avgRating: number | null;
  ratingCount: number;
  currentOpenLoad: number;
  performanceLabel: ResolverPerformanceLabel;
  isSampleSizeSufficient: boolean;
}

export interface SlaBreachItemDto {
  id: string;
  publicId: string;
  categoryName: string;
  levelFrom: number;
  levelTo: number;
  reason: string;
  hoursOverdue: number;
  resolverAtTime: string | null;
  occurredAt: string;
}

export interface ResolverDetailDto extends ResolverSummaryDto {
  recentBreaches: SlaBreachItemDto[];
  dailyTrend: {
    date: string;
    resolved: number;
    breaches: number;
  }[];
}

export interface SlaBreachReportDto {
  items: SlaBreachItemDto[];
  total: number;
  page: number;
  limit: number;
}

export const ReportTypeEnum = z.enum([
  'category-trends',
  'aging',
  'resolver-performance',
  'sla-breaches',
  'satisfaction',
  'monthly-summary',
]);
export type ReportType = z.infer<typeof ReportTypeEnum>;

export const ReportFormatEnum = z.enum(['json', 'xlsx', 'pdf']);
export type ReportFormat = z.infer<typeof ReportFormatEnum>;

export const ExportReportQuerySchema = z.object({
  format: ReportFormatEnum.default('json'),
  range: AnalyticsRangeEnum.default('30d'),
  categoryId: z.string().uuid().optional(),
  priority: GrievancePriorityEnum.optional(),
  level: z.coerce.number().int().min(1).max(4).optional(),
});
export type ExportReportQueryDto = z.infer<typeof ExportReportQuerySchema>;

