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

// ==============================================================================
// PHASE 5: COMMUNITY MODULES CONTRACTS
// ==============================================================================

// --- (A) NOTICEBOARD AND POLLS ---

export const NoticeStatusEnum = z.enum(['DRAFT', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED']);
export type NoticeStatus = z.infer<typeof NoticeStatusEnum>;

export const NoticePriorityEnum = z.enum(['NORMAL', 'IMPORTANT', 'EMERGENCY']);
export type NoticePriority = z.infer<typeof NoticePriorityEnum>;

export const NoticeAudienceTypeEnum = z.enum(['ALL', 'WINGS', 'ROLES']);
export type NoticeAudienceType = z.infer<typeof NoticeAudienceTypeEnum>;

export interface NoticeCategoryDto {
  id: string;
  nameEn: string;
  nameHi: string;
  nameMr: string;
  isSystem: boolean;
  sortOrder: number;
}

export const CreateNoticeSchema = z.object({
  categoryId: z.string().uuid(),
  title: z.string().min(3).max(200),
  body: z.string().min(5),
  priority: NoticePriorityEnum.default('NORMAL'),
  pinned: z.boolean().default(false),
  pinOrder: z.number().int().min(0).default(0),
  audienceType: NoticeAudienceTypeEnum.default('ALL'),
  targetWingIds: z.array(z.string().uuid()).optional(),
  targetRoles: z.array(z.string()).optional(),
  publishAt: z.string().optional(),
  expiresAt: z.string().optional(),
  requiresAck: z.boolean().default(false),
  translations: z
    .object({
      hi: z.object({ title: z.string(), body: z.string() }).optional(),
      mr: z.object({ title: z.string(), body: z.string() }).optional(),
    })
    .optional(),
  attachmentKeys: z.array(z.string()).optional(),
});
export type CreateNoticeDto = z.infer<typeof CreateNoticeSchema>;

export const UpdateNoticeSchema = CreateNoticeSchema.extend({
  editReason: z.string().optional(),
});
export type UpdateNoticeDto = z.infer<typeof UpdateNoticeSchema>;

export interface NoticeListItemDto {
  id: string;
  title: string;
  bodyPreview: string;
  categoryId: string;
  categoryName: string;
  priority: NoticePriority;
  status: NoticeStatus;
  pinned: boolean;
  pinOrder: number;
  audienceType: NoticeAudienceType;
  publishAt: string | null;
  expiresAt: string | null;
  requiresAck: boolean;
  isRead: boolean;
  isAcknowledged: boolean;
  publishedAt: string | null;
  hasEdits: boolean;
  attachmentCount: number;
  createdAt: string;
}

export interface NoticeDetailDto extends NoticeListItemDto {
  body: string;
  createdByName: string;
  translations?: {
    hi?: { title: string; body: string };
    mr?: { title: string; body: string };
  };
  attachments: {
    id: string;
    fileName: string;
    mime: string;
    size: number;
    downloadUrl: string;
  }[];
  versions: {
    versionNum: number;
    title: string;
    body: string;
    editedByName: string;
    reason: string;
    createdAt: string;
  }[];
  versionHistory?: {
    versionNum: number;
    title: string;
    body: string;
    editedByName: string;
    reason: string;
    createdAt: string;
  }[];
}

export interface NoticeReaderStatsDto {
  noticeId: string;
  totalTargeted: number;
  readCount: number;
  acknowledgedCount: number;
  unreadFlats: {
    flatId: string;
    flatNumber: string;
    wingName: string;
  }[];
  unacknowledgedFlats: {
    flatId: string;
    flatNumber: string;
    wingName: string;
  }[];
}

// --- Polls ---

export const PollTypeEnum = z.enum(['SINGLE', 'MULTIPLE']);
export type PollType = z.infer<typeof PollTypeEnum>;

export const PollEligibilityEnum = z.enum(['ALL_RESIDENTS', 'OWNERS_ONLY', 'ROLES']);
export type PollEligibility = z.infer<typeof PollEligibilityEnum>;

export const PollVoteUnitEnum = z.enum(['PER_USER', 'PER_FLAT']);
export type PollVoteUnit = z.infer<typeof PollVoteUnitEnum>;

export const PollBallotTypeEnum = z.enum(['SECRET', 'OPEN']);
export type PollBallotType = z.infer<typeof PollBallotTypeEnum>;

export const PollResultsVisibilityEnum = z.enum(['AFTER_VOTE', 'AFTER_CLOSE', 'ADMIN_ONLY']);
export type PollResultsVisibility = z.infer<typeof PollResultsVisibilityEnum>;

export const PollStatusEnum = z.enum(['DRAFT', 'OPEN', 'CLOSED', 'CANCELLED']);
export type PollStatus = z.infer<typeof PollStatusEnum>;

export const CreatePollSchema = z.object({
  noticeId: z.string().uuid().optional(),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  type: PollTypeEnum.default('SINGLE'),
  maxChoices: z.number().int().min(1).max(10).default(1),
  eligibility: PollEligibilityEnum.default('ALL_RESIDENTS'),
  voteUnit: PollVoteUnitEnum.default('PER_USER'),
  ballot: PollBallotTypeEnum.default('SECRET'),
  resultsVisibility: PollResultsVisibilityEnum.default('AFTER_VOTE'),
  quorumPercent: z.number().min(0).max(100).optional(),
  opensAt: z.string(),
  closesAt: z.string(),
  options: z
    .array(
      z.object({
        labelEn: z.string().min(1).max(200),
        labelHi: z.string().max(200).optional(),
        labelMr: z.string().max(200).optional(),
        sortOrder: z.number().int().default(0),
      })
    )
    .min(2),
});
export type CreatePollDto = z.infer<typeof CreatePollSchema>;

export const VotePollSchema = z.object({
  selectedOptionIds: z.array(z.string().uuid()).min(1),
});
export type VotePollDto = z.infer<typeof VotePollSchema>;

export interface PollOptionDto {
  id: string;
  labelEn: string;
  labelHi?: string | null;
  labelMr?: string | null;
  label?: string;
  sortOrder: number;
  voteCount?: number;
  votePercentage?: number;
  votes?: number;
  percentage?: number;
}

export interface PollListItemDto {
  id: string;
  title: string;
  description?: string | null;
  type: PollType;
  status: PollStatus;
  ballot: PollBallotType;
  resultsVisibility: PollResultsVisibility;
  opensAt: string;
  closesAt: string;
  hasVoted: boolean;
  totalVotes: number;
  quorumReached?: boolean | null;
  quorumPercent?: number | null;
  eligibility?: PollEligibility;
  voteUnit?: PollVoteUnit;
  turnoutPercent?: number;
  votesCast?: number;
  totalEligible?: number;
  quorumAchieved?: boolean | null;
  isQuorumMet?: boolean | null;
  totalTurnout?: number;
  optionsCount?: number;
  createdAt?: string;
}

export interface PollDetailDto extends PollListItemDto {
  options: PollOptionDto[];
  isEligible: boolean;
  userVotedAt?: string | null;
  userChoices?: string[];
  resultHash?: string | null;
  canViewResults: boolean;
  maxChoices?: number;
  myVotedOptionIds?: string[];
}

// --- (B) DIRECTORY AND EMERGENCY CONTACTS ---

export const DirectoryPreferenceSchema = z.object({
  visible: z.boolean().default(false),
  showName: z.boolean().default(false),
  showFlat: z.boolean().default(false),
  showMobile: z.boolean().default(false),
  showEmail: z.boolean().default(false),
  showPhoto: z.boolean().default(false),
  showResidentType: z.boolean().default(false),
});
export type DirectoryPreferenceDto = z.infer<typeof DirectoryPreferenceSchema>;

export const DirectorySearchQuerySchema = z.object({
  query: z.string().min(3, 'Search query must be at least 3 characters'),
  wingId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(20),
});
export type DirectorySearchQueryDto = z.infer<typeof DirectorySearchQuerySchema>;

export interface DirectoryMemberCardDto {
  id: string;
  fullName?: string | null;
  wingName?: string | null;
  flatNumber?: string | null;
  mobile?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  residentType?: string | null;
  role?: string | null;
}

export interface OfficeBearerDto {
  id: string;
  userId: string;
  fullName: string;
  title: string;
  displayOrder: number;
  publicToResidents: boolean;
  mobile?: string | null;
  email?: string | null;
  photoUrl?: string | null;
}

export const EmergencyCategoryEnum = z.enum([
  'security',
  'ambulance',
  'fire',
  'police',
  'water_board',
  'electricity_board',
  'lift_service',
  'other',
]);
export type EmergencyCategory = z.infer<typeof EmergencyCategoryEnum>;

export const CreateEmergencyContactSchema = z.object({
  name: z.string().min(2).max(150),
  category: EmergencyCategoryEnum,
  phone: z.string().min(3).max(50),
  notes: z.string().max(500).optional(),
  sortOrder: z.number().int().default(0),
});
export type CreateEmergencyContactDto = z.infer<typeof CreateEmergencyContactSchema>;

export interface EmergencyContactDto {
  id: string;
  name: string;
  category: EmergencyCategory;
  phone: string;
  notes?: string | null;
  sortOrder: number;
}

export const CreateServiceProviderSchema = z.object({
  name: z.string().min(2).max(150),
  category: z.string().min(2).max(100),
  phone: z.string().min(3).max(50),
  area: z.string().max(150).optional(),
  notes: z.string().max(500).optional(),
});
export type CreateServiceProviderDto = z.infer<typeof CreateServiceProviderSchema>;

export interface ServiceProviderDto {
  id: string;
  name: string;
  category: string;
  phone: string;
  area?: string | null;
  notes?: string | null;
  isApproved: boolean;
  avgStars: number | null;
  reviewCount: number;
}

export const CreateServiceReviewSchema = z.object({
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type CreateServiceReviewDto = z.infer<typeof CreateServiceReviewSchema>;

export interface ServiceProviderReviewDto {
  id: string;
  providerId: string;
  stars: number;
  comment?: string | null;
  createdAt: string;
}

// --- (C) DOMESTIC STAFF MANAGEMENT ---

export const StaffTypeEnum = z.enum(['maid', 'cook', 'driver', 'nanny', 'gardener', 'other']);
export type StaffType = z.infer<typeof StaffTypeEnum>;

export const StaffStatusEnum = z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED', 'BLOCKED']);
export type StaffStatus = z.infer<typeof StaffStatusEnum>;

export const StaffIdProofTypeEnum = z.enum([
  'AADHAAR',
  'PAN',
  'VOTER_ID',
  'PASSPORT',
  'DRIVING_LICENSE',
]);
export type StaffIdProofType = z.infer<typeof StaffIdProofTypeEnum>;

export const StaffScheduleWindowSchema = z.object({
  day: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Must be HH:mm format'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Must be HH:mm format'),
});
export type StaffScheduleWindow = z.infer<typeof StaffScheduleWindowSchema>;

export const RegisterStaffSchema = z.object({
  fullName: z.string().min(2).max(150),
  staffType: StaffTypeEnum,
  mobile: z.string().regex(/^[0-9]{10}$/, 'Mobile must be 10 digits'),
  flatId: z.string().uuid(),
  photoKey: z.string().optional(),
  idProofKey: z.string().optional(),
  idProofType: StaffIdProofTypeEnum.optional(),
  schedule: z.array(StaffScheduleWindowSchema).min(1, 'At least one schedule window required'),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must confirm consent to share staff details with the society' }),
  }),
});
export type RegisterStaffDto = z.infer<typeof RegisterStaffSchema>;

export const LinkExistingStaffSchema = z.object({
  staffId: z.string().uuid(),
  flatId: z.string().uuid(),
  schedule: z.array(StaffScheduleWindowSchema).min(1),
  consent: z.literal(true),
});
export type LinkExistingStaffDto = z.infer<typeof LinkExistingStaffSchema>;

export interface StaffListItemDto {
  id: string;
  fullName: string;
  staffType: StaffType;
  status: StaffStatus;
  photoUrl?: string | null;
  linkedFlatsCount: number;
  todayAttendanceStatus: 'PRESENT' | 'ABSENT' | 'CHECKED_IN';
  inAt?: string | null;
  outAt?: string | null;
  hasPass: boolean;
  passSerial?: string | null;
  createdAt: string;
}

export interface StaffDetailDto extends StaffListItemDto {
  schedule: StaffScheduleWindow[];
  pass?: {
    serial: string;
    token: string;
    validTo: string;
    qrData: string;
  } | null;
  linkedFlats: {
    flatId: string;
    flatNumber: string;
    wingName: string;
    entryAllowed: boolean;
  }[];
  avgStars: number | null;
  reviewCount: number;
  reviews: {
    id: string;
    stars: number;
    comment?: string | null;
    createdAt: string;
  }[];
  idProofStatus?: {
    type: StaffIdProofType;
    hasImage: boolean;
  } | null;
}

export interface StaffPassVerificationDto {
  isValid: boolean;
  staffId?: string;
  staffName?: string;
  staffType?: StaffType;
  status?: StaffStatus;
  isScheduleAllowed: boolean;
  reason?: string;
  allowedFlats: string[];
}

export const MarkAttendanceSchema = z.object({
  staffId: z.string().uuid(),
  flatId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  inAt: z.string().optional(),
  outAt: z.string().optional(),
  note: z.string().max(255).optional(),
});
export type MarkAttendanceDto = z.infer<typeof MarkAttendanceSchema>;

export interface StaffAttendanceItemDto {
  id: string;
  staffId: string;
  staffName: string;
  flatNumber: string;
  date: string;
  inAt?: string | null;
  outAt?: string | null;
  source: 'MANUAL' | 'GUARD_SCAN';
  markedByName: string;
  note?: string | null;
  isCorrected: boolean;
}

export const VerifyStaffSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  reason: z.string().optional(),
});
export type VerifyStaffDto = z.infer<typeof VerifyStaffSchema>;

export const BlockStaffSchema = z.object({
  reason: z.string().min(5, 'Block reason must be at least 5 characters'),
  stepUpToken: z.string().min(1, 'Step-up verification required'),
});
export type BlockStaffDto = z.infer<typeof BlockStaffSchema>;

export const MergeStaffSchema = z.object({
  primaryStaffId: z.string().uuid(),
  secondaryStaffId: z.string().uuid(),
  reason: z.string().min(5),
  stepUpToken: z.string().min(1),
});
export type MergeStaffDto = z.infer<typeof MergeStaffSchema>;

export const CreateStaffReviewSchema = z.object({
  flatId: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
export type CreateStaffReviewDto = z.infer<typeof CreateStaffReviewSchema>;

export const StaffSettingsSchema = z.object({
  idProofMode: z.enum(['IMAGE_ONLY', 'NONE']).default('IMAGE_ONLY'),
  retentionDays: z.number().int().min(1).max(365).default(30),
});
export type StaffSettingsDto = z.infer<typeof StaffSettingsSchema>;


