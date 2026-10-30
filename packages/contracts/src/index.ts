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

// ==============================================================================
// PHASE 6: (A) VISITORS AND DELIVERIES CONTRACTS
// ==============================================================================

export type VisitorPassType = 'ONE_TIME' | 'RECURRING' | 'GROUP' | 'VEHICLE_ONLY' | 'VENDOR';
export type VisitorPassStatus = 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
export type VisitSource = 'PREAPPROVED' | 'WALKIN' | 'DELIVERY' | 'CAB' | 'STAFF' | 'OVERRIDE';
export type VisitDecision = 'APPROVED' | 'DENIED' | 'TIMEOUT_DEFAULT' | 'GUARD_OVERRIDE';
export type ApprovalRequestStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';

export const CreateVisitorPassSchema = z.object({
  flatId: z.string().uuid(),
  type: z.enum(['ONE_TIME', 'RECURRING', 'GROUP', 'VEHICLE_ONLY', 'VENDOR']).default('ONE_TIME'),
  visitorName: z.string().min(2, 'Name must be at least 2 characters'),
  visitorPhone: z.string().optional(),
  purpose: z.string().min(2, 'Purpose is required'),
  guestsCount: z.number().int().min(1).default(1),
  vehicleNo: z.string().optional(),
  validFrom: z.string(),
  validTo: z.string(),
  recurrence: z.object({
    days: z.array(z.number()),
    startTime: z.string(),
    endTime: z.string(),
  }).optional(),
  maxEntries: z.number().int().min(1).default(1),
});
export type CreateVisitorPassDto = z.infer<typeof CreateVisitorPassSchema>;

export interface VisitorPassItemDto {
  id: string;
  type: VisitorPassType;
  visitorName: string;
  visitorPhone?: string | null;
  purpose: string;
  guestsCount: number;
  vehicleNo?: string | null;
  validFrom: string;
  validTo: string;
  passCode: string;
  qrToken: string;
  status: VisitorPassStatus;
  entriesUsed: number;
  maxEntries: number;
  flatNumber: string;
  hostName: string;
  createdAt: string;
}

export interface VerifyPassResultDto {
  isValid: boolean;
  reason?: string;
  passId?: string;
  visitorName?: string;
  flatNumber?: string;
  flatId?: string;
  purpose?: string;
  guestsCount?: number;
  vehicleNo?: string | null;
  status?: VisitorPassStatus;
  type?: VisitorPassType;
  isExpired?: boolean;
  isScheduleAllowed?: boolean;
}

export const CreateWalkinSchema = z.object({
  flatId: z.string().uuid(),
  visitorName: z.string().min(2),
  visitorPhone: z.string().optional(),
  purpose: z.string().min(2),
  guestsCount: z.number().int().min(1).default(1),
  vehicleNo: z.string().optional(),
  photoKey: z.string().optional(),
  source: z.enum(['WALKIN', 'CAB', 'DELIVERY', 'OVERRIDE']).default('WALKIN'),
  notes: z.string().optional(),
});
export type CreateWalkinDto = z.infer<typeof CreateWalkinSchema>;

export const RespondApprovalSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(['APPROVED', 'DENIED', 'WAIT']),
});
export type RespondApprovalDto = z.infer<typeof RespondApprovalSchema>;

export interface VisitLogItemDto {
  id: string;
  visitorName: string;
  purpose: string;
  vehicleNo?: string | null;
  guestsCount: number;
  flatNumber: string;
  flatId: string;
  source: VisitSource;
  decision: VisitDecision;
  decidedAt?: string | null;
  inAt: string;
  outAt?: string | null;
  guardInName?: string | null;
  guardOutName?: string | null;
  gateName?: string | null;
  notes?: string | null;
  overstayAlertedAt?: string | null;
  photoKey?: string | null;
}

export interface ApprovalRequestItemDto {
  id: string;
  visitLogId: string;
  flatId: string;
  flatNumber: string;
  visitorName: string;
  purpose: string;
  vehicleNo?: string | null;
  guestsCount: number;
  photoKey?: string | null;
  requestedAt: string;
  expiresAt: string;
  status: ApprovalRequestStatus;
  remainingSeconds: number;
}

// Deliveries
export type DeliveryCompany = 'Amazon' | 'Flipkart' | 'Swiggy' | 'Zomato' | 'Other';
export type DeliveryRule = 'ALLOW_IN' | 'LEAVE_AT_GATE' | 'ASK_ME';
export type DeliveryStatus = 'EXPECTED' | 'ARRIVED' | 'HANDED_OVER' | 'LEFT_AT_GATE' | 'DENIED' | 'CANCELLED';

export const CreateDeliveryExpectedSchema = z.object({
  flatId: z.string().uuid(),
  company: z.enum(['Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'Other']),
  reference: z.string().optional(),
  windowFrom: z.string(),
  windowTo: z.string(),
  rule: z.enum(['ALLOW_IN', 'LEAVE_AT_GATE', 'ASK_ME']).default('ALLOW_IN'),
});
export type CreateDeliveryExpectedDto = z.infer<typeof CreateDeliveryExpectedSchema>;

export interface DeliveryExpectedItemDto {
  id: string;
  flatId: string;
  flatNumber: string;
  company: DeliveryCompany;
  reference?: string | null;
  windowFrom: string;
  windowTo: string;
  rule: DeliveryRule;
  status: DeliveryStatus;
  createdAt: string;
}

export const LogDeliveryArrivalSchema = z.object({
  flatId: z.string().uuid(),
  expectedId: z.string().uuid().optional(),
  company: z.enum(['Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'Other']),
  agentName: z.string().optional(),
  outcome: z.enum(['HANDED_OVER', 'LEFT_AT_GATE', 'DENIED']),
  note: z.string().optional(),
});
export type LogDeliveryArrivalDto = z.infer<typeof LogDeliveryArrivalSchema>;

export interface DeliveryLogItemDto {
  id: string;
  flatId: string;
  flatNumber: string;
  company: string;
  agentName?: string | null;
  arrivedAt: string;
  resolvedAt?: string | null;
  outcome: string;
  guardName?: string | null;
  note?: string | null;
  collectedAt?: string | null;
}

// Blocklist & Frequent Visitors
export const CreateBlocklistSchema = z.object({
  flatId: z.string().uuid().optional().nullable(),
  personPhone: z.string().optional(),
  name: z.string().optional(),
  vehicleNo: z.string().optional(),
  reason: z.string().min(3),
});
export type CreateBlocklistDto = z.infer<typeof CreateBlocklistSchema>;

export interface BlocklistItemDto {
  id: string;
  flatNumber?: string | null;
  name?: string | null;
  vehicleNo?: string | null;
  reason: string;
  active: boolean;
  createdAt: string;
}

export const CreateFrequentVisitorSchema = z.object({
  flatId: z.string().uuid(),
  name: z.string().min(2),
  phone: z.string().optional(),
  label: z.string().min(2),
});
export type CreateFrequentVisitorDto = z.infer<typeof CreateFrequentVisitorSchema>;

export interface FrequentVisitorItemDto {
  id: string;
  flatId: string;
  name: string;
  phone?: string | null;
  label: string;
  createdAt: string;
}

// Gate Settings
export const GateSettingsSchema = z.object({
  visitorPhotoMode: z.enum(['OFF', 'OPTIONAL', 'REQUIRED']).default('OFF'),
  visitorRetentionDays: z.number().int().min(7).max(365).default(90),
  defaultApprovalTimeoutSeconds: z.number().int().min(30).max(300).default(120),
  defaultTimeoutAction: z.enum(['DENY', 'ASK_GUARD', 'ALLOW_IF_FREQUENT']).default('DENY'),
  overstayGraceMinutes: z.number().int().min(5).max(180).default(30),
  gateOfflineAlertMinutes: z.number().int().min(1).max(60).default(5),
});
export type GateSettingsDto = z.infer<typeof GateSettingsSchema>;

// Gate & Devices
export const RegisterGateDeviceSchema = z.object({
  gateId: z.string().uuid().optional(),
  name: z.string().min(2),
});
export type RegisterGateDeviceDto = z.infer<typeof RegisterGateDeviceSchema>;

export interface GateDeviceItemDto {
  id: string;
  gateId?: string | null;
  gateName?: string | null;
  name: string;
  lastSeenAt?: string | null;
  isRevoked: boolean;
  createdAt: string;
}

// ==============================================================================
// PHASE 6: (B) GUARD CONSOLE AND GUARD MANAGEMENT CONTRACTS
// ==============================================================================

export interface GuardProfileDto {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  mobile: string;
  employeeCode: string;
  agency?: string | null;
  photoKey?: string | null;
  emergencyContactName?: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  hasPin: boolean;
  createdAt: string;
}

export const CreateGuardProfileSchema = z.object({
  userId: z.string().uuid(),
  employeeCode: z.string().min(2),
  agency: z.string().optional(),
  photoKey: z.string().optional(),
  idProofKey: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});
export type CreateGuardProfileDto = z.infer<typeof CreateGuardProfileSchema>;

export interface ShiftTemplateDto {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export const CreateShiftTemplateSchema = z.object({
  name: z.string().min(2),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});
export type CreateShiftTemplateDto = z.infer<typeof CreateShiftTemplateSchema>;

export interface ShiftItemDto {
  id: string;
  guardId: string;
  guardName: string;
  gateId?: string | null;
  gateName?: string | null;
  startsAt: string;
  endsAt: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'MISSED';
}

export const CreateShiftSchema = z.object({
  guardId: z.string().uuid(),
  gateId: z.string().uuid().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
});
export type CreateShiftDto = z.infer<typeof CreateShiftSchema>;

export interface GuardAttendanceItemDto {
  id: string;
  guardId: string;
  guardName: string;
  shiftId?: string | null;
  checkInAt: string;
  checkOutAt?: string | null;
  method: string;
  deviceName?: string | null;
}

export interface CheckpointDto {
  id: string;
  name: string;
  qrSlug: string;
  sortOrder: number;
}

export const CreateCheckpointSchema = z.object({
  name: z.string().min(2),
  qrSlug: z.string().min(3),
  sortOrder: z.number().int().default(0),
});
export type CreateCheckpointDto = z.infer<typeof CreateCheckpointSchema>;

export const ScanCheckpointSchema = z.object({
  qrSlug: z.string().min(3),
  shiftId: z.string().uuid().optional(),
});
export type ScanCheckpointDto = z.infer<typeof ScanCheckpointSchema>;

export interface PatrolLogItemDto {
  id: string;
  guardName: string;
  checkpointName: string;
  scannedAt: string;
  shiftId?: string | null;
}

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentType =
  | 'suspicious_person'
  | 'vehicle'
  | 'fire_hazard'
  | 'fight'
  | 'damage'
  | 'medical'
  | 'other';

export const CreateIncidentSchema = z.object({
  type: z.enum([
    'suspicious_person',
    'vehicle',
    'fire_hazard',
    'fight',
    'damage',
    'medical',
    'other',
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  description: z.string().min(5),
  photoKeys: z.array(z.string()).optional(),
  gateId: z.string().uuid().optional(),
});
export type CreateIncidentDto = z.infer<typeof CreateIncidentSchema>;

export interface IncidentLogItemDto {
  id: string;
  guardName: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  photoKeys: string[];
  gateName?: string | null;
  status: 'OPEN' | 'REVIEWED' | 'CLOSED';
  createdAt: string;
  reviewedByName?: string | null;
}

export const ShiftHandoverSchema = z.object({
  toShiftId: z.string().uuid().optional(),
  toGuardId: z.string().uuid().optional(),
  notes: z.string().min(5),
});
export type ShiftHandoverDto = z.infer<typeof ShiftHandoverSchema>;

export interface ShiftHandoverItemDto {
  id: string;
  fromGuardName: string;
  toGuardName?: string | null;
  notes: string;
  acknowledgedByName?: string | null;
  acknowledgedAt?: string | null;
  createdAt: string;
}

export const SetGuardPinSchema = z.object({
  pin: z.string().regex(/^\d{4,6}$/, 'PIN must be 4 to 6 numeric digits'),
});
export type SetGuardPinDto = z.infer<typeof SetGuardPinSchema>;

export const UnlockGuardPinSchema = z.object({
  pin: z.string(),
});
export type UnlockGuardPinDto = z.infer<typeof UnlockGuardPinSchema>;

// ==============================================================================
// PHASE 6: (C) SOS EMERGENCY CONTRACTS
// ==============================================================================

export type SosType = 'MEDICAL' | 'FIRE' | 'THEFT' | 'OTHER' | 'GUARD_DISTRESS';
export type SosStatus =
  | 'RAISED'
  | 'ACKNOWLEDGED'
  | 'RESPONDING'
  | 'RESOLVED'
  | 'FALSE_ALARM'
  | 'CANCELLED';
export type SosAction = 'ACK' | 'ON_THE_WAY' | 'ARRIVED' | 'NOTE';

export const RaiseSosSchema = z.object({
  type: z.enum(['MEDICAL', 'FIRE', 'THEFT', 'OTHER', 'GUARD_DISTRESS']).default('OTHER'),
  note: z.string().max(200).optional(),
  locationMode: z.enum(['FLAT_ONLY', 'SHARED']).default('FLAT_ONLY'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  accuracy: z.number().optional(),
  flatId: z.string().uuid().optional(),
});
export type RaiseSosDto = z.infer<typeof RaiseSosSchema>;

export interface SosAlertItemDto {
  id: string;
  flatNumber: string;
  flatId: string;
  residentName: string;
  residentPhone?: string | null;
  type: SosType;
  note?: string | null;
  locationMode: 'FLAT_ONLY' | 'SHARED';
  lat?: number | null;
  lng?: number | null;
  accuracy?: number | null;
  status: SosStatus;
  raisedAt: string;
  cancelWindowEndsAt: string;
  acknowledgedByName?: string | null;
  acknowledgedAt?: string | null;
  resolvedByName?: string | null;
  resolvedAt?: string | null;
  outcomeNote?: string | null;
  isDrill: boolean;
  escalationTier: number;
  responsesCount: number;
  remainingCancelSeconds?: number;
}

export interface SosResponseItemDto {
  id: string;
  alertId: string;
  userName: string;
  role: string;
  action: SosAction;
  note?: string | null;
  createdAt: string;
}

export interface SosSettingDto {
  cancelWindowSeconds: number;
  ackTimeoutSeconds: number;
  tier2TimeoutSeconds: number;
  repeatSound: boolean;
  drillsEnabled: boolean;
  gateOfflineAlertMinutes: number;
}

export const UpdateSosSettingSchema = z.object({
  cancelWindowSeconds: z.number().int().min(0).max(30).optional(),
  ackTimeoutSeconds: z.number().int().min(10).max(300).optional(),
  tier2TimeoutSeconds: z.number().int().min(30).max(600).optional(),
  repeatSound: z.boolean().optional(),
  drillsEnabled: z.boolean().optional(),
  gateOfflineAlertMinutes: z.number().int().min(1).max(60).optional(),
});
export type UpdateSosSettingDto = z.infer<typeof UpdateSosSettingSchema>;

export const AckSosSchema = z.object({
  alertId: z.string().uuid(),
});
export type AckSosDto = z.infer<typeof AckSosSchema>;

export const RespondSosSchema = z.object({
  action: z.enum(['ON_THE_WAY', 'ARRIVED', 'NOTE']),
  note: z.string().max(255).optional(),
});
export type RespondSosDto = z.infer<typeof RespondSosSchema>;

export const ResolveSosSchema = z.object({
  status: z.enum(['RESOLVED', 'FALSE_ALARM']),
  outcomeNote: z.string().max(500).optional(),
});
export type ResolveSosDto = z.infer<typeof ResolveSosSchema>;

export const StartDrillSchema = z.object({
  type: z.enum(['MEDICAL', 'FIRE', 'THEFT', 'OTHER']).default('FIRE'),
});
export type StartDrillDto = z.infer<typeof StartDrillSchema>;

// ==============================================================================
// PHASE 7A: AMENITY BOOKING CONTRACTS
// ==============================================================================

export { formatPaise, formatPaiseRaw, amountInWords, roundHalfUp, formatReceiptNo, formatBillNo, financialYearLabel, financialYearBounds, multiplyPaise, perSqft, applyPercent, cancellationFee, parsePaiseFromString } from './money';
export type { Paise } from './money';

export const AmenityTypeEnum = z.enum(['CLUBHOUSE', 'GYM', 'POOL', 'HALL', 'COURT', 'OTHER']);
export type AmenityType = z.infer<typeof AmenityTypeEnum>;

export const AmenityModeEnum = z.enum(['EXCLUSIVE', 'CAPACITY']);
export type AmenityMode = z.infer<typeof AmenityModeEnum>;

export const FeeModeEnum = z.enum(['NONE', 'PER_SLOT', 'PER_BOOKING']);
export type FeeMode = z.infer<typeof FeeModeEnum>;

export const FeeCollectionEnum = z.enum(['COLLECT_BEFORE_CONFIRM', 'ADD_TO_NEXT_BILL']);
export type FeeCollection = z.infer<typeof FeeCollectionEnum>;

export const BookingStatusEnum = z.enum([
  'PENDING_APPROVAL', 'AWAITING_PAYMENT', 'CONFIRMED', 'CANCELLED',
  'REJECTED', 'COMPLETED', 'NO_SHOW', 'EXPIRED',
]);
export type BookingStatus = z.infer<typeof BookingStatusEnum>;

export const CreateAmenitySchema = z.object({
  type: AmenityTypeEnum,
  nameEn: z.string().min(2).max(100),
  nameHi: z.string().min(2).max(100),
  descriptionEn: z.string().max(2000).optional(),
  descriptionHi: z.string().max(2000).optional(),
  rulesEn: z.string().max(5000).optional(),
  rulesHi: z.string().max(5000).optional(),
  photoKeys: z.array(z.string()).max(10).default([]),
  capacityTotal: z.number().int().min(1).default(1),
  mode: AmenityModeEnum.default('EXCLUSIVE'),
  openHours: z.record(z.string(), z.object({
    open: z.string().regex(/^\d{2}:\d{2}$/),
    close: z.string().regex(/^\d{2}:\d{2}$/),
    enabled: z.boolean(),
  })).optional(),
  slotMinutes: z.number().int().min(15).max(1440).default(60),
  minSlots: z.number().int().min(1).default(1),
  maxSlots: z.number().int().min(1).default(4),
  advanceDaysMax: z.number().int().min(1).default(30),
  minNoticeHours: z.number().int().min(0).default(2),
  maxBookingsPerFlatPerWeek: z.number().int().min(1).default(2),
  maxGuests: z.number().int().min(0).default(20),
  feeMode: FeeModeEnum.default('NONE'),
  feePaise: z.number().int().min(0).default(0),
  depositPaise: z.number().int().min(0).default(0),
  feeCollection: FeeCollectionEnum.default('COLLECT_BEFORE_CONFIRM'),
  holdHours: z.number().int().min(1).default(24),
  requiresApproval: z.boolean().default(false),
  cancellationFreeHours: z.number().int().min(0).default(24),
  cancellationFeePercent: z.number().min(0).max(100).default(0),
  active: z.boolean().default(true),
});
export type CreateAmenityDto = z.infer<typeof CreateAmenitySchema>;

export const CreateBookingSchema = z.object({
  amenityId: z.string().uuid(),
  slotStart: z.string(),
  slotCount: z.number().int().min(1),
  peopleCount: z.number().int().min(1),
  guestsCount: z.number().int().min(0).default(0),
  purpose: z.string().min(2).max(255),
  overrideDues: z.boolean().default(false),
  overrideNote: z.string().max(255).optional(),
});
export type CreateBookingDto = z.infer<typeof CreateBookingSchema>;

export const CancelBookingSchema = z.object({
  reason: z.string().min(5).max(255),
});
export type CancelBookingDto = z.infer<typeof CancelBookingSchema>;

export interface AmenityListItemDto {
  id: string; type: AmenityType; name: string; description?: string;
  photoKeys: string[]; capacityTotal: number; mode: AmenityMode;
  feeMode: FeeMode; feePaise: number; depositPaise: number;
  nextAvailableSlot?: string | null; active: boolean;
}

export interface BookingDetailDto {
  id: string; amenityId: string; amenityName: string; flatId: string;
  flatNumber: string; bookedBy: string; bookedByName: string;
  slotStart: string; slotEnd: string; slotCount: number; peopleCount: number;
  guestsCount: number; purpose: string; status: BookingStatus;
  holdExpiresAt: string | null; feePaise: number; depositPaise: number;
  passToken?: string; checkedInAt?: string | null; cancellationFeePaise?: number;
  createdAt: string;
}

// ==============================================================================
// PHASE 7B: MAINTENANCE BILLING CONTRACTS
// ==============================================================================

export const OccupancyEnum = z.enum(['OWNER_OCCUPIED', 'TENANT', 'VACANT']);
export type Occupancy = z.infer<typeof OccupancyEnum>;

export const CalcMethodEnum = z.enum([
  'FIXED_PER_FLAT', 'PER_SQFT', 'BY_FLAT_TYPE', 'PER_PARKING_SLOT', 'MANUAL',
]);
export type CalcMethod = z.infer<typeof CalcMethodEnum>;

export const BillCycleStatusEnum = z.enum(['DRAFT', 'PREVIEWED', 'ISSUED', 'CLOSED']);
export type BillCycleStatus = z.infer<typeof BillCycleStatusEnum>;

export const BillStatusEnum = z.enum([
  'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED',
]);
export type BillStatus = z.infer<typeof BillStatusEnum>;

export const LedgerEntryTypeEnum = z.enum([
  'BILL', 'PAYMENT', 'LATE_FEE', 'ADJUSTMENT', 'WAIVER',
  'CREDIT_NOTE', 'REFUND', 'OPENING_BALANCE', 'REVERSAL', 'AMENITY_FEE', 'DEPOSIT',
]);
export type LedgerEntryType = z.infer<typeof LedgerEntryTypeEnum>;

export const PaymentModeEnum = z.enum(['CASH', 'OFFLINE_UPI', 'CHEQUE', 'BANK_TRANSFER']);
export type PaymentMode = z.infer<typeof PaymentModeEnum>;

export const AllocationStrategyEnum = z.enum(['OLDEST_FIRST', 'SPECIFIC_BILL', 'ADVANCE']);
export type AllocationStrategy = z.infer<typeof AllocationStrategyEnum>;

export const AdjustmentTypeEnum = z.enum([
  'WAIVER', 'CREDIT_NOTE', 'REFUND', 'VOID', 'BILL_CANCEL',
]);
export type AdjustmentType = z.infer<typeof AdjustmentTypeEnum>;

export const CashSessionStatusEnum = z.enum(['OPEN', 'CLOSED', 'RECONCILED']);
export type CashSessionStatus = z.infer<typeof CashSessionStatusEnum>;

export const CreateBillHeadSchema = z.object({
  nameEn: z.string().min(2).max(100),
  nameHi: z.string().min(2).max(100),
  calcMethod: CalcMethodEnum,
  ratePaise: z.number().int().min(0).default(0),
  rateTable: z.record(z.string(), z.number().int().min(0)).optional(),
  taxPercent: z.number().min(0).max(30).default(0),
  active: z.boolean().default(true),
  sort: z.number().int().default(0),
});
export type CreateBillHeadDto = z.infer<typeof CreateBillHeadSchema>;

export const CreateBillCycleSchema = z.object({
  name: z.string().min(3).max(50),
  periodStart: z.string(),
  periodEnd: z.string(),
  dueDate: z.string(),
  headIds: z.array(z.string().uuid()).min(1),
});
export type CreateBillCycleDto = z.infer<typeof CreateBillCycleSchema>;

export const RecordPaymentSchema = z.object({
  flatId: z.string().uuid(),
  amountPaise: z.number().int().min(1),
  receivedOn: z.string(),
  receivedFromName: z.string().min(2).max(100),
  mode: PaymentModeEnum.default('CASH'),
  allocationStrategy: AllocationStrategyEnum.default('OLDEST_FIRST'),
  specificBillId: z.string().uuid().optional(),
  note: z.string().max(255).optional(),
  idempotencyKey: z.string().min(8).max(64),
});
export type RecordPaymentDto = z.infer<typeof RecordPaymentSchema>;

export const CreateAdjustmentSchema = z.object({
  type: AdjustmentTypeEnum,
  flatId: z.string().uuid(),
  amountPaise: z.number().int().min(0),
  reason: z.string().min(30).max(1000),
  billId: z.string().uuid().optional(),
  paymentId: z.string().uuid().optional(),
});
export type CreateAdjustmentDto = z.infer<typeof CreateAdjustmentSchema>;

export const CreateDisputeSchema = z.object({
  kind: z.enum(['ENTRY_WRONG', 'PAID_NOT_RECORDED']),
  paymentId: z.string().uuid().optional(),
  claimAmountPaise: z.number().int().min(1).optional(),
  claimDate: z.string().optional(),
  note: z.string().min(10).max(1000),
  attachmentKeys: z.array(z.string()).max(5).default([]),
});
export type CreateDisputeDto = z.infer<typeof CreateDisputeSchema>;

export interface BillSummaryDto {
  id: string; billNo: string; flatNumber: string; wingName: string;
  cycleName: string; periodStart: string; periodEnd: string; dueDate: string;
  subtotalPaise: number; taxPaise: number; adjustmentsPaise: number;
  totalPaise: number; status: BillStatus; lateFeesPaise: number; totalDuePaise: number;
}

export interface LedgerEntryDto {
  id: string; seq: number; entryType: LedgerEntryType;
  direction: 'DEBIT' | 'CREDIT'; amountPaise: number;
  refType: string; refId: string; narration: string;
  createdByName: string; createdAt: string;
  runningBalancePaise: number; hash: string;
}

export interface PaymentReceiptDto {
  id: string; receiptNo: string; flatNumber: string; wingName: string;
  receivedFromName: string; amountPaise: number; amountInWords: string;
  mode: PaymentMode; receivedOn: string; collectorName: string; collectorRole: string;
  allocations: { description: string; amountPaise: number }[];
  remainingBalancePaise: number; receiptHash: string; auditChainStamp: string;
  societyName: string; societyAddress: string; generatedAt: string;
}

export interface CashSessionSummaryDto {
  id: string; collectorName: string; date: string; openedAt: string;
  closedAt: string | null; expectedPaise: number; countedPaise: number | null;
  variancePaise: number | null; status: CashSessionStatus; paymentsCount: number;
}

// ----------------------------------------------------------------------------
// Phase 8: (A) Vendors, (B) CMS & Support, (C) Privacy & Operations
// ----------------------------------------------------------------------------
export * from './vendor.schema';
export * from './cms.schema';
export * from './privacy.schema';

