const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  code: string;
  referenceId?: string;
  status: number;
  data?: any;

  constructor(message: string, code: string, status: number, referenceId?: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.referenceId = referenceId;
    this.data = data;
  }
}

async function request<T = any>(
  endpoint: string,
  options: RequestInit = {},
  stepUpToken?: string
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (stepUpToken) {
    headers.set('X-Step-Up-Token', stepUpToken);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') || '';
  let data: any = null;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType.includes('text/')) {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.message || response.statusText || 'Request failed';
    const errorCode = data?.code || 'UNKNOWN_ERROR';
    const referenceId = data?.referenceId;
    throw new ApiError(errorMsg, errorCode, response.status, referenceId, data);
  }

  return data;
}

export const api = {
  // 1. Auth & Recovery
  getChallenge: () => request<{ nonce: string; difficulty: number; expiresAt: number }>('/auth/challenge'),
  login: (body: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  refresh: () => request('/auth/refresh', { method: 'POST' }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  verify2fa: (body: { tempToken: string; code: string }) =>
    request('/auth/2fa/verify', { method: 'POST', body: JSON.stringify(body) }),
  stepUp: (body: { password: string; totpCode?: string }) =>
    request('/auth/step-up', { method: 'POST', body: JSON.stringify(body) }),
  activate: (body: { username: string; activationCode: string; verifyDetail: string }) =>
    request('/auth/activate', { method: 'POST', body: JSON.stringify(body) }),
  setInitialPassword: (body: { activationToken: string; newPassword: string; confirmPassword?: string }) =>
    request('/auth/activate/password', { method: 'POST', body: JSON.stringify(body) }),
  setupRecovery: (body: { activationToken: string; questions: any[] }) =>
    request('/auth/activate/recovery', { method: 'POST', body: JSON.stringify(body) }),
  enrolTotp: (tempToken: string) =>
    request('/auth/activate/totp', { method: 'POST', body: JSON.stringify({ tempToken }) }),
  confirmTotp: (body: { totpToken: string; code: string }) =>
    request('/auth/activate/totp/confirm', { method: 'POST', body: JSON.stringify(body) }),
  startRecovery: (username: string) =>
    request('/auth/recovery/start', { method: 'POST', body: JSON.stringify({ username }) }),
  verifyRecoveryQuestions: (body: { username: string; answers: any[] }) =>
    request('/auth/recovery/verify-questions', { method: 'POST', body: JSON.stringify(body) }),
  useRecoveryCode: (body: { username: string; recoveryCode: string; newPassword: string }) =>
    request('/auth/recovery/use-code', { method: 'POST', body: JSON.stringify(body) }),
  resetPasswordWithTicket: (body: { ticketToken: string; newPassword: string }) =>
    request('/auth/recovery/reset-with-ticket', { method: 'POST', body: JSON.stringify(body) }),
  getSetupStatus: () => request<{ available: boolean }>('/auth/setup/status'),
  setupFirstAdmin: (body: any) => request('/auth/setup', { method: 'POST', body: JSON.stringify(body) }),

  // 2. Users Management
  listUsers: (query: { search?: string; role?: string; status?: string; wing?: string; page?: number }) => {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.role) params.set('role', query.role);
    if (query.status) params.set('status', query.status);
    if (query.wing) params.set('wing', query.wing);
    if (query.page) params.set('page', query.page.toString());
    return request(`/users?${params.toString()}`);
  },
  getUser: (id: string) => request(`/users/${id}`),
  createUser: (body: any) => request('/users', { method: 'POST', body: JSON.stringify(body) }),
  reissueCode: (id: string, verifyDetail: string, stepUpToken: string) =>
    request(`/users/${id}/activation-code`, { method: 'POST', body: JSON.stringify({ verifyDetail }) }, stepUpToken),
  changeRole: (id: string, newRole: string, stepUpToken: string) =>
    request(`/users/${id}/change-role`, { method: 'POST', body: JSON.stringify({ newRole }) }, stepUpToken),
  updateStatus: (id: string, status: 'ACTIVE' | 'DISABLED') =>
    request(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getMySessions: () => request('/users/me/sessions'),
  getProfile: () => request('/users/me'),
  updatePreferences: (body: { language?: string; fontSize?: string; directoryVisible?: boolean }) =>
    request('/users/me/preferences', { method: 'PATCH', body: JSON.stringify(body) }),
  revokeMySession: (sessionId: string) => request(`/users/me/sessions/${sessionId}`, { method: 'DELETE' }),
  revokeOtherSessions: () => request('/users/me/sessions/revoke-others', { method: 'POST' }),
  nominateSuperAdmin: (nomineeUserId: string) =>
    request('/users/super-admin/nominate', { method: 'POST', body: JSON.stringify({ nomineeUserId }) }),
  confirmSuperAdmin: (transferId: string, demotedRole: string, stepUpToken: string) =>
    request('/users/super-admin/confirm', { method: 'POST', body: JSON.stringify({ transferId, demotedRole }) }, stepUpToken),
  listRecoveryRequests: () => request('/users/recovery-requests'),
  cancelRecovery: (ticketId: string) => request(`/users/recovery-requests/${ticketId}/cancel`, { method: 'POST' }),
  approveRecovery: (ticketId: string, stepUpToken: string) =>
    request(`/users/recovery-requests/${ticketId}/approve`, { method: 'POST' }, stepUpToken),

  // 3. Import & Slips
  getTemplateUrl: () => `${API_URL}/import/template`,
  uploadImport: (fileBase64: string, filename: string) =>
    request('/import/upload', { method: 'POST', body: JSON.stringify({ fileBase64, filename }) }),
  commitImport: (batchId: string, stepUpToken: string) =>
    request('/import/commit', { method: 'POST', body: JSON.stringify({ batchId }) }, stepUpToken),
  rollbackImport: (batchId: string) => request(`/import/rollback/${batchId}`, { method: 'POST' }),

  // 4. Societies & Structure
  getCurrentSociety: () => request('/societies/current'),
  getWings: () => request('/societies/wings'),
  getFlats: (wingId?: string) => request(`/societies/flats${wingId ? `?wingId=${wingId}` : ''}`),

  // 5. Audit & Verification
  getAuditLogs: (page: number = 1, limit: number = 20) => request(`/audit?page=${page}&limit=${limit}`),
  getFilteredAuditLogs: (query: { page?: number; limit?: number; actorId?: string; action?: string; entityType?: string; fromDate?: string; toDate?: string }) => {
    const params = new URLSearchParams();
    if (query.page) params.set('page', query.page.toString());
    if (query.limit) params.set('limit', query.limit.toString());
    if (query.actorId) params.set('actorId', query.actorId);
    if (query.action) params.set('action', query.action);
    if (query.entityType) params.set('entityType', query.entityType);
    if (query.fromDate) params.set('fromDate', query.fromDate);
    if (query.toDate) params.set('toDate', query.toDate);
    return request(`/audit?${params.toString()}`);
  },
  verifyAuditChain: () => request('/audit/verify'),
  getLatestAuditHash: () => request('/audit/latest-hash'),
  exportAuditCsvUrl: (fromDate?: string, toDate?: string) => {
    const params = new URLSearchParams();
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    return `${API_URL}/audit/export?${params.toString()}`;
  },

  // 6. In-App Notifications
  getNotifications: () => request<{ items: any[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),

  // 7. Grievances (Resident)
  submitGrievance: (body: any) => request('/grievances', { method: 'POST', body: JSON.stringify(body) }),
  listMyGrievances: (statusFilter?: string) =>
    request(`/grievances${statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : ''}`),
  getGrievance: (id: string) => request(`/grievances/${id}`),
  addGrievanceNote: (id: string, body: { note: string }) =>
    request(`/grievances/${id}/notes`, { method: 'POST', body: JSON.stringify(body) }),
  remindResolver: (id: string) => request(`/grievances/${id}/remind`, { method: 'POST' }),
  markGrievanceResolved: (id: string) => request(`/grievances/${id}/mark-resolved`, { method: 'POST' }),
  appealGrievance: (id: string, body: { reason: string }) =>
    request(`/grievances/${id}/appeal`, { method: 'POST', body: JSON.stringify(body) }),
  reopenGrievance: (id: string) => request(`/grievances/${id}/reopen`, { method: 'POST' }),
  rateGrievance: (id: string, body: { stars: number; comment?: string; tags?: string[] }) =>
    request(`/grievances/${id}/rate`, { method: 'POST', body: JSON.stringify(body) }),
  saveDraft: (payload: any) => request('/grievances/drafts', { method: 'PUT', body: JSON.stringify(payload) }),
  getDraft: () => request('/grievances/drafts'),
  cancelDraft: () => request('/grievances/drafts', { method: 'DELETE' }),
  uploadEvidence: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/evidence/upload', {
      method: 'POST',
      body: formData,
    });
  },
  trackPublic: (publicId: string, code: string) =>
    request(`/grievances/public/track?publicId=${encodeURIComponent(publicId)}&code=${encodeURIComponent(code)}`),

  // 8. Grievances (Admin / Resolver)
  getAdminKPIs: () => request('/admin/grievances/kpis'),
  getAdminInbox: (query: { status?: string; level?: number; urgent?: boolean; assignedToMe?: boolean }) => {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.level) params.set('level', query.level.toString());
    if (query.urgent) params.set('urgent', 'true');
    if (query.assignedToMe) params.set('assignedToMe', 'true');
    return request(`/admin/grievances/inbox?${params.toString()}`);
  },
  getAdminGrievance: (id: string) => request(`/admin/grievances/${id}`),
  acknowledgeGrievance: (id: string) => request(`/admin/grievances/${id}/acknowledge`, { method: 'POST' }),
  updateGrievanceStatus: (id: string, body: { status: string; closureNote?: string }) =>
    request(`/admin/grievances/${id}/status`, { method: 'POST', body: JSON.stringify(body) }),
  addAdminInternalNote: (id: string, body: { note: string }) =>
    request(`/admin/grievances/${id}/internal-note`, { method: 'POST', body: JSON.stringify(body) }),
  requestGrievanceInfo: (id: string, body: { question: string }) =>
    request(`/admin/grievances/${id}/request-info`, { method: 'POST', body: JSON.stringify(body) }),
  manualEscalateGrievance: (id: string, body: { reason: string }) =>
    request(`/admin/grievances/${id}/escalate`, { method: 'POST', body: JSON.stringify(body) }),
  assignGrievance: (id: string, body: { assignedTo: string; reason?: string }) =>
    request(`/admin/grievances/${id}/assign`, { method: 'POST', body: JSON.stringify(body) }),
  flagGrievance: (id: string, body: { flagged: boolean; reason: string }) =>
    request(`/admin/grievances/${id}/flag`, { method: 'POST', body: JSON.stringify(body) }),
  createOnBehalf: (body: any) => request('/admin/grievances/on-behalf', { method: 'POST', body: JSON.stringify(body) }),
  revealIdentity: (id: string, body: { reason: string }, stepUpToken: string) =>
    request(`/admin/grievances/${id}/reveal-identity`, { method: 'POST', body: JSON.stringify(body) }, stepUpToken),

  // 9. Governance & Settings
  getCategories: () => request('/governance/categories'),
  createCategory: (body: any) => request('/governance/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id: string, body: any) => request(`/governance/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (id: string) => request(`/governance/categories/${id}`, { method: 'DELETE' }),

  getAreaTags: () => request('/governance/area-tags'),
  createAreaTag: (body: any) => request('/governance/area-tags', { method: 'POST', body: JSON.stringify(body) }),

  getGovernanceChain: () => request('/governance/chain'),
  updateGovernanceAssignment: (body: any, stepUpToken: string) =>
    request('/governance/chain', { method: 'POST', body: JSON.stringify(body) }, stepUpToken),

  getSlaMatrix: () => request('/governance/sla'),
  updateSlaConfig: (body: any, stepUpToken: string) =>
    request('/governance/sla', { method: 'POST', body: JSON.stringify(body) }, stepUpToken),

  getWorkingHours: () => request('/governance/working-hours'),
  updateWorkingHours: (body: any) => request('/governance/working-hours', { method: 'PUT', body: JSON.stringify(body) }),

  getSocietySettings: () => request('/governance/settings'),
  updateSocietySetting: (key: string, value: string) =>
    request(`/governance/settings/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ value }) }),

  listLeaves: () => request('/governance/leaves'),
  createLeave: (body: any) => request('/governance/leaves', { method: 'POST', body: JSON.stringify(body) }),
  cancelLeave: (id: string) => request(`/governance/leaves/${id}`, { method: 'DELETE' }),

  // 10. Escalation Monitor
  getEscalationMonitor: () => request('/escalation/monitor'),

  // 11. (A) Noticeboard
  getNotices: (params?: { categoryId?: string; search?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.categoryId) q.set('categoryId', params.categoryId);
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    return request(`/notices?${q.toString()}`);
  },
  getNoticeDetail: (id: string) => request(`/notices/${id}`),
  acknowledgeNotice: (id: string) => request(`/notices/${id}/acknowledge`, { method: 'POST' }),
  getNoticeCategories: () => request('/notices/categories'),
  getAdminNotices: (status?: string) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/admin/notices${q}`);
  },
  createNotice: (body: any) => request('/admin/notices', { method: 'POST', body: JSON.stringify(body) }),
  updateNotice: (id: string, body: any) => request(`/admin/notices/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  archiveNotice: (id: string) => request(`/admin/notices/${id}/archive`, { method: 'POST' }),
  getNoticeReaders: (id: string) => request(`/admin/notices/${id}/readers`),

  // 12. (A) Community Polls
  getCommunityPolls: () => request('/community/polls'),
  getPollDetail: (id: string) => request(`/community/polls/${id}`),
  castPollVote: (id: string, body: { optionIds: string[] }) =>
    request(`/community/polls/${id}/vote`, { method: 'POST', body: JSON.stringify(body) }),
  getAdminPolls: () => request('/admin/polls'),
  createPoll: (body: any) => request('/admin/polls', { method: 'POST', body: JSON.stringify(body) }),
  closePoll: (id: string) => request(`/admin/polls/${id}/close`, { method: 'POST' }),
  extendPoll: (id: string, body: { closesAt: string; reason: string }, stepUpToken: string) =>
    request(`/admin/polls/${id}/extend`, { method: 'POST', body: JSON.stringify(body) }, stepUpToken),

  // 13. (B) Society Directory & Emergency Contacts
  searchDirectory: (query: string, wingId?: string, page = 1, limit = 20) => {
    const q = new URLSearchParams({ query, page: page.toString(), limit: limit.toString() });
    if (wingId) q.set('wingId', wingId);
    return request(`/directory?${q.toString()}`);
  },
  getDirectoryPreference: () => request('/directory/preference'),
  updateDirectoryPreference: (body: any) =>
    request('/directory/preference', { method: 'PUT', body: JSON.stringify(body) }),
  getOfficeBearers: () => request('/directory/office-bearers'),
  getEmergencyContacts: () => request('/directory/emergency-contacts'),
  getServiceProviders: (category?: string) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return request(`/directory/services${q}`);
  },
  submitServiceReview: (providerId: string, body: { stars: number; comment?: string }) =>
    request(`/directory/services/${providerId}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
  getAdminDirectoryOverview: () => request('/admin/directory/overview'),
  createEmergencyContact: (body: any) =>
    request('/admin/emergency-contacts', { method: 'POST', body: JSON.stringify(body) }),
  deleteEmergencyContact: (id: string) => request(`/admin/emergency-contacts/${id}`, { method: 'DELETE' }),
  createServiceProvider: (body: any) =>
    request('/admin/service-providers', { method: 'POST', body: JSON.stringify(body) }),
  toggleProviderApproval: (id: string, isApproved: boolean) =>
    request(`/admin/service-providers/${id}/approval`, { method: 'PUT', body: JSON.stringify({ isApproved }) }),

  // 14. (C) Domestic Staff Management
  getResidentStaff: (flatId?: string) => {
    const q = flatId ? `?flatId=${encodeURIComponent(flatId)}` : '';
    return request(`/staff${q}`);
  },
  getStaffDetail: (id: string, flatId?: string) => {
    const q = flatId ? `?flatId=${encodeURIComponent(flatId)}` : '';
    return request(`/staff/${id}${q}`);
  },
  registerStaff: (body: any) => request('/staff', { method: 'POST', body: JSON.stringify(body) }),
  linkExistingStaff: (body: any) => request('/staff/link', { method: 'POST', body: JSON.stringify(body) }),
  markStaffAttendance: (id: string, body: any) =>
    request(`/staff/${id}/attendance`, { method: 'POST', body: JSON.stringify(body) }),
  getStaffAttendance: (id: string, flatId?: string, month?: string) => {
    const q = new URLSearchParams();
    if (flatId) q.set('flatId', flatId);
    if (month) q.set('month', month);
    return request(`/staff/${id}/attendance?${q.toString()}`);
  },
  submitStaffReview: (id: string, body: { flatId: string; stars: number; comment?: string }) =>
    request(`/staff/${id}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
  verifyStaffPass: (token: string) =>
    request('/staff/verify-pass', { method: 'POST', body: JSON.stringify({ token }) }),
  getAdminStaffList: (status?: string) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/admin/staff${q}`);
  },
  verifyStaffMember: (id: string, body: { status: 'VERIFIED' | 'REJECTED'; reason?: string }) =>
    request(`/admin/staff/${id}/verify`, { method: 'POST', body: JSON.stringify(body) }),
  blockStaffMember: (id: string, body: { reason: string; stepUpToken: string }, stepUpToken: string) =>
    request(`/admin/staff/${id}/block`, { method: 'POST', body: JSON.stringify(body) }, stepUpToken),
  unblockStaffMember: (id: string, reason: string) =>
    request(`/admin/staff/${id}/unblock`, { method: 'POST', body: JSON.stringify({ reason }) }),
  getStaffIdProofSignedUrl: (id: string) => request(`/admin/staff/${id}/id-proof`),
  mergeStaffMembers: (body: any, stepUpToken: string) =>
    request('/admin/staff/merge', { method: 'POST', body: JSON.stringify(body) }, stepUpToken),

  // 15. Phase 6 (A) Visitors & Passes
  createVisitorPass: (body: any) => request('/visitors/passes', { method: 'POST', body: JSON.stringify(body) }),
  listVisitorPasses: (flatId?: string) => {
    const q = flatId ? `?flatId=${encodeURIComponent(flatId)}` : '';
    return request(`/visitors/passes${q}`);
  },
  cancelVisitorPass: (id: string) => request(`/visitors/passes/${id}/cancel`, { method: 'PUT' }),
  verifyPass: (body: { token?: string; code?: string }) =>
    request('/visitors/verify', { method: 'POST', body: JSON.stringify(body) }),
  admitPass: (id: string) => request(`/visitors/passes/${id}/admit`, { method: 'POST' }),
  createWalkin: (body: any) => request('/visitors/walkin', { method: 'POST', body: JSON.stringify(body) }),
  respondApproval: (body: any) => request('/visitors/approvals/respond', { method: 'POST', body: JSON.stringify(body) }),
  listVisitLogs: (flatId?: string, onlyInside?: boolean) => {
    const q = new URLSearchParams();
    if (flatId) q.set('flatId', flatId);
    if (onlyInside) q.set('onlyInside', 'true');
    return request(`/visitors/logs?${q.toString()}`);
  },
  markVisitExit: (id: string) => request(`/visitors/logs/${id}/exit`, { method: 'PUT' }),
  createBlocklist: (body: any) => request('/visitors/blocklist', { method: 'POST', body: JSON.stringify(body) }),
  listBlocklist: (flatId?: string) => {
    const q = flatId ? `?flatId=${encodeURIComponent(flatId)}` : '';
    return request(`/visitors/blocklist${q}`);
  },
  createFrequentVisitor: (body: any) => request('/visitors/frequent', { method: 'POST', body: JSON.stringify(body) }),
  listFrequentVisitors: (flatId?: string) => {
    const q = flatId ? `?flatId=${encodeURIComponent(flatId)}` : '';
    return request(`/visitors/frequent${q}`);
  },

  // 16. Phase 6 (A) Deliveries
  createExpectedDelivery: (body: any) => request('/visitors/deliveries/expected', { method: 'POST', body: JSON.stringify(body) }),
  listExpectedDeliveries: (flatId?: string) => {
    const q = flatId ? `?flatId=${encodeURIComponent(flatId)}` : '';
    return request(`/visitors/deliveries/expected${q}`);
  },
  logDeliveryArrival: (body: any) => request('/visitors/deliveries/arrival', { method: 'POST', body: JSON.stringify(body) }),
  listDeliveryLogs: (flatId?: string) => {
    const q = flatId ? `?flatId=${encodeURIComponent(flatId)}` : '';
    return request(`/visitors/deliveries/logs${q}`);
  },
  markDeliveryCollected: (id: string) => request(`/visitors/deliveries/logs/${id}/collect`, { method: 'PUT' }),

  // 17. Phase 6 (B) Guards & Gate Console
  sendGuardHeartbeat: (deviceId?: string) =>
    request('/guards/heartbeat', { method: 'POST', body: JSON.stringify({ deviceId }) }),
  getOnlineGuardsStatus: () => request('/guards/status/online'),
  setGuardPin: (pin: string) => request('/guards/pin/set', { method: 'POST', body: JSON.stringify({ pin }) }),
  unlockGuardPin: (pin: string) => request('/guards/pin/unlock', { method: 'POST', body: JSON.stringify({ pin }) }),
  guardShiftCheckIn: (shiftId?: string, deviceId?: string) =>
    request('/guards/shift/check-in', { method: 'POST', body: JSON.stringify({ shiftId, deviceId }) }),
  guardShiftCheckOut: (shiftId?: string) =>
    request('/guards/shift/check-out', { method: 'POST', body: JSON.stringify({ shiftId }) }),
  logGuardIncident: (body: any) => request('/guards/incidents', { method: 'POST', body: JSON.stringify(body) }),
  listGuardIncidents: () => request('/guards/incidents'),
  listCheckpoints: () => request('/guards/checkpoints'),
  scanPatrolCheckpoint: (body: any) => request('/guards/patrol/scan', { method: 'POST', body: JSON.stringify(body) }),
  submitShiftHandover: (body: any) => request('/guards/handover', { method: 'POST', body: JSON.stringify(body) }),
  verifyStaffScan: (token: string) =>
    request('/guards/staff/verify-scan', { method: 'POST', body: JSON.stringify({ token }) }),
  listGuardProfiles: () => request('/guards/profiles'),
  getMyGuardProfile: () => request('/guards/profile/me'),
  listGuardShifts: (guardId?: string) => {
    const q = guardId ? `?guardId=${encodeURIComponent(guardId)}` : '';
    return request(`/guards/shifts${q}`);
  },
  registerGateDevice: (body: any) => request('/guards/devices', { method: 'POST', body: JSON.stringify(body) }),
  listGateDevices: () => request('/guards/devices'),
  revokeGateDevice: (id: string) => request(`/guards/devices/${id}/revoke`, { method: 'PUT' }),

  // 18. Phase 6 (C) SOS Emergency
  raiseSos: (body: any) => request('/sos/raise', { method: 'POST', body: JSON.stringify(body) }),
  cancelSos: (id: string) => request(`/sos/alerts/${id}/cancel`, { method: 'PUT' }),
  acknowledgeSos: (id: string) => request(`/sos/alerts/${id}/ack`, { method: 'POST' }),
  respondSos: (id: string, body: any) => request(`/sos/alerts/${id}/respond`, { method: 'POST', body: JSON.stringify(body) }),
  resolveSos: (id: string, body: any) => request(`/sos/alerts/${id}/resolve`, { method: 'PUT', body: JSON.stringify(body) }),
  listSosAlerts: (flatId?: string, activeOnly = false) => {
    const q = new URLSearchParams();
    if (flatId) q.set('flatId', flatId);
    if (activeOnly) q.set('activeOnly', 'true');
    return request(`/sos/alerts?${q.toString()}`);
  },
  getSosResponses: (id: string) => request(`/sos/alerts/${id}/responses`),
  startSosDrill: (body: any) => request('/sos/drills/start', { method: 'POST', body: JSON.stringify(body) }),
  getSosSettings: () => request('/sos/settings'),
  updateSosSetting: (body: any) => request('/sos/settings', { method: 'PUT', body: JSON.stringify(body) }),

  // 19. Phase 7 (A) Amenities
  listAmenities: () => request('/amenities'),
  getAmenities: () => request('/amenities'),
  getAmenity: (id: string) => request(`/amenities/${id}`),
  getAmenityAvailability: (id: string, from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    return request(`/amenities/${id}/availability?${q.toString()}`);
  },
  createAmenityBooking: (body: any) => request('/amenities/bookings', { method: 'POST', body: JSON.stringify(body) }),
  getMyAmenityBookings: () => request('/amenities/my-bookings'),
  getAmenityBooking: (id: string) => request(`/amenities/bookings/${id}`),
  cancelAmenityBooking: (id: string, reason: string) =>
    request(`/amenities/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),

  // Admin Amenities
  createAdminAmenity: (body: any) => request('/admin/amenities', { method: 'POST', body: JSON.stringify(body) }),
  updateAdminAmenity: (id: string, body: any) => request(`/admin/amenities/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  addAmenityBlackout: (id: string, body: any) => request(`/admin/amenities/${id}/blackouts`, { method: 'POST', body: JSON.stringify(body) }),
  getAdminAmenityBookings: (params: any = {}) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) q.set(k, String(v));
    }
    return request(`/admin/amenities/bookings?${q.toString()}`);
  },
  approveAmenityBooking: (id: string) => request(`/admin/amenities/bookings/${id}/approve`, { method: 'POST' }),
  rejectAmenityBooking: (id: string, reason: string) =>
    request(`/admin/amenities/bookings/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  markAmenityNoShow: (id: string) => request(`/admin/amenities/bookings/${id}/no-show`, { method: 'POST' }),
  getAmenityReports: (from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    return request(`/admin/amenities/reports?${q.toString()}`);
  },
  getAmenitySettings: () => request('/admin/amenities/settings'),
  updateAmenitySettings: (body: any) => request('/admin/amenities/settings', { method: 'PUT', body: JSON.stringify(body) }),

  // Guard Amenities
  getGuardTodaysBookings: () => request('/guard/amenities/today'),
  guardCheckInAmenity: (bookingId: string, passToken?: string) =>
    request('/guard/amenities/check-in', { method: 'POST', body: JSON.stringify({ bookingId, passToken }) }),
  guardMarkNoShow: (bookingId: string) =>
    request('/guard/amenities/no-show', { method: 'POST', body: JSON.stringify({ bookingId }) }),

  // 20. Phase 7 (B) Maintenance Billing
  getMyBills: () => request('/billing/bills'),
  getBillDetail: (id: string) => request(`/billing/bills/${id}`),
  getMyPayments: () => request('/billing/payments'),
  getPaymentReceipt: (id: string) => request(`/billing/payments/${id}`),
  verifyReceipt: (q: string) => request(`/billing/receipts/verify?q=${encodeURIComponent(q)}`),
  getMyStatement: () => request('/billing/statement'),
  getMyDisputes: () => request('/billing/disputes'),
  createDispute: (body: any) => request('/billing/disputes', { method: 'POST', body: JSON.stringify(body) }),
  getHowToPay: () => request('/billing/how-to-pay'),

  // Admin Billing
  getBillingOverview: () => request('/admin/billing/overview'),
  listBillHeads: () => request('/admin/billing/heads'),
  createBillHead: (body: any) => request('/admin/billing/heads', { method: 'POST', body: JSON.stringify(body) }),
  updateBillHead: (id: string, body: any) => request(`/admin/billing/heads/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  listBillCycles: () => request('/admin/billing/cycles'),
  previewBillCycle: (body: any) => request('/admin/billing/cycles/preview', { method: 'POST', body: JSON.stringify(body) }),
  commitBillCycle: (id: string) => request(`/admin/billing/cycles/${id}/commit`, { method: 'POST' }),
  recordCashPayment: (body: any) => request('/admin/billing/payments', { method: 'POST', body: JSON.stringify(body) }),
  listAdminPayments: (params?: { flatId?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.flatId) q.set('flatId', params.flatId);
    if (params?.limit) q.set('limit', String(params.limit));
    return request(`/admin/billing/payments?${q.toString()}`);
  },
  getCurrentCashSession: () => request('/admin/billing/sessions/current'),
  openCashSession: () => request('/admin/billing/sessions/open', { method: 'POST' }),
  closeCashSession: (body: any) => request('/admin/billing/sessions/close', { method: 'POST', body: JSON.stringify(body) }),
  reconcileCashSession: (id: string) => request(`/admin/billing/sessions/${id}/reconcile`, { method: 'POST' }),
  listAdjustments: (status?: string) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/admin/billing/adjustments${q}`);
  },
  createAdjustmentRequest: (body: any) => request('/admin/billing/adjustments', { method: 'POST', body: JSON.stringify(body) }),
  decideAdjustment: (id: string, decision: 'APPROVED' | 'REJECTED', decisionNote?: string) =>
    request(`/admin/billing/adjustments/${id}/decide`, { method: 'POST', body: JSON.stringify({ decision, decisionNote }) }),
  listBillingDisputes: (status?: string) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/admin/billing/disputes${q}`);
  },
  resolveBillingDispute: (id: string, status: 'RESOLVED' | 'REJECTED', outcomeNote: string) =>
    request(`/admin/billing/disputes/${id}/resolve`, { method: 'POST', body: JSON.stringify({ status, outcomeNote }) }),
  getDefaultersReport: () => request('/admin/billing/defaulters'),
  getFlatLedger: (flatId: string) => request(`/admin/billing/ledger/${flatId}`),
  verifyFlatLedger: (flatId: string) => request(`/admin/billing/ledger/${flatId}/verify`, { method: 'POST' }),
  previewOpeningBalances: (rows: any[]) => request('/admin/billing/opening-balances/preview', { method: 'POST', body: JSON.stringify({ rows }) }),
  commitOpeningBalances: (body: { items: any[]; creatorId: string }) =>
    request('/admin/billing/opening-balances/commit', { method: 'POST', body: JSON.stringify(body) }),
  getBillingSettings: () => request('/admin/billing/settings'),
  updateBillingSettings: (body: any) => request('/admin/billing/settings', { method: 'PUT', body: JSON.stringify(body) }),

  // 21. Phase 8 (A) Vendor Portal
  getVendorTasks: (status?: string) => request(`/vendor/tasks${status ? `?status=${encodeURIComponent(status)}` : ''}`),
  getVendorTask: (id: string) => request(`/vendor/tasks/${id}`),
  acceptVendorTask: (id: string) => request(`/vendor/tasks/${id}/accept`, { method: 'POST' }),
  declineVendorTask: (id: string, reason: string) =>
    request(`/vendor/tasks/${id}/decline`, { method: 'POST', body: JSON.stringify({ reason }) }),
  scheduleVendorVisit: (id: string, body: { expectedVisitFrom: string; expectedVisitTo: string }) =>
    request(`/vendor/tasks/${id}/schedule-visit`, { method: 'POST', body: JSON.stringify(body) }),
  startVendorTask: (id: string) => request(`/vendor/tasks/${id}/start`, { method: 'POST' }),
  completeVendorTask: (id: string, body: { completionNote: string }) =>
    request(`/vendor/tasks/${id}/complete`, { method: 'POST', body: JSON.stringify(body) }),
  uploadVendorTaskPhoto: (id: string, body: { kind: 'BEFORE' | 'AFTER' | 'OTHER'; storageKey: string; mime: string; size: number; sha256: string }) =>
    request(`/vendor/tasks/${id}/photos`, { method: 'POST', body: JSON.stringify(body) }),
  getVendorProfile: () => request('/vendor/profile'),
  getGrievanceVendorTask: (grievanceId: string) => request(`/vendors/grievance-task/${grievanceId}`),
  confirmVendorTaskResident: (id: string, body: { confirmation: 'CONFIRMED' | 'NOT_FIXED' | 'NO_RESPONSE'; rating?: number; comment?: string; reopenReason?: string }) =>
    request(`/vendors/tasks/${id}/resident-confirm`, { method: 'POST', body: JSON.stringify(body) }),
  toggleVendorContactShare: (id: string, share: boolean) =>
    request(`/vendors/tasks/${id}/share-contact`, { method: 'POST', body: JSON.stringify({ share }) }),

  // Admin Vendors
  listVendors: (params?: { category?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.status) q.set('status', params.status);
    return request(`/admin/vendors?${q.toString()}`);
  },
  createVendor: (body: any) => request('/admin/vendors', { method: 'POST', body: JSON.stringify(body) }),
  getVendor: (id: string) => request(`/admin/vendors/${id}`),
  updateVendor: (id: string, body: any) => request(`/admin/vendors/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  getVendorPerformance: (id: string) => request(`/admin/vendors/${id}/performance`),
  listVendorTasksAdmin: (params?: { vendorId?: string; status?: string; grievanceId?: string }) => {
    const q = new URLSearchParams();
    if (params?.vendorId) q.set('vendorId', params.vendorId);
    if (params?.status) q.set('status', params.status);
    if (params?.grievanceId) q.set('grievanceId', params.grievanceId);
    return request(`/admin/vendor-tasks?${q.toString()}`);
  },
  createVendorTaskAdmin: (body: any) => request('/admin/vendor-tasks', { method: 'POST', body: JSON.stringify(body) }),
  reassignVendorTaskAdmin: (id: string, body: { vendorId: string; reason?: string }) =>
    request(`/admin/vendor-tasks/${id}/reassign`, { method: 'POST', body: JSON.stringify(body) }),

  // 22. Phase 8 (B) Content, Support, and Messages
  getPublicFaqs: (societyId?: string) => request(`/cms/faq${societyId ? `?societyId=${societyId}` : ''}`),
  getPublicTestimonials: (societyId?: string) => request(`/cms/testimonials${societyId ? `?societyId=${societyId}` : ''}`),
  submitPublicContact: (body: any) => request('/cms/contact', { method: 'POST', body: JSON.stringify(body) }),
  getPublicSiteSettings: (societyId?: string) => request(`/cms/site-settings${societyId ? `?societyId=${societyId}` : ''}`),

  submitTestimonial: (body: any) => request('/cms/resident/testimonials', { method: 'POST', body: JSON.stringify(body) }),
  listConversationsResident: () => request('/cms/resident/conversations'),
  getConversationResident: (id: string) => request(`/cms/resident/conversations/${id}`),
  createConversationResident: (body: any) => request('/cms/resident/conversations', { method: 'POST', body: JSON.stringify(body) }),
  sendMessageResident: (convId: string, body: any) =>
    request(`/cms/resident/conversations/${convId}/messages`, { method: 'POST', body: JSON.stringify(body) }),
  createSupportTicketResident: (body: any) => request('/cms/resident/support-tickets', { method: 'POST', body: JSON.stringify(body) }),

  listAllFaqsAdmin: () => request('/admin/cms/faq'),
  saveFaqAdmin: (body: any) => request('/admin/cms/faq', { method: 'POST', body: JSON.stringify(body) }),
  deleteFaqAdmin: (id: string) => request(`/admin/cms/faq/${id}`, { method: 'DELETE' }),
  listTestimonialsAdmin: (status?: string) => request(`/admin/cms/testimonials${status ? `?status=${status}` : ''}`),
  moderateTestimonialAdmin: (id: string, body: any) =>
    request(`/admin/cms/testimonials/${id}/moderate`, { method: 'POST', body: JSON.stringify(body) }),
  listContactRequestsAdmin: (status?: string) => request(`/admin/cms/contact-requests${status ? `?status=${status}` : ''}`),
  updateContactStatusAdmin: (id: string, status: string, notes?: string) =>
    request(`/admin/cms/contact-requests/${id}/status`, { method: 'POST', body: JSON.stringify({ status, notes }) }),
  listSupportConversationsAdmin: () => request('/admin/cms/support/conversations'),
  getSupportConversationAdmin: (id: string) => request(`/admin/cms/support/conversations/${id}`),
  replySupportConversationAdmin: (convId: string, body: any) =>
    request(`/admin/cms/support/conversations/${convId}/messages`, { method: 'POST', body: JSON.stringify(body) }),
  listSupportTicketsAdmin: (status?: string) => request(`/admin/cms/support/tickets${status ? `?status=${status}` : ''}`),
  resolveSupportTicketAdmin: (id: string, resolution: string) =>
    request(`/admin/cms/support/tickets/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolution }) }),
  updateSiteSettingAdmin: (key: string, body: any) =>
    request(`/admin/cms/site-settings/${key}`, { method: 'PUT', body: JSON.stringify(body) }),

  // 23. Phase 8 (E) Privacy & Data Requests (DPDP Act 2023)
  submitPublicPrivacyRequest: (body: any) => request('/privacy/requests/public', { method: 'POST', body: JSON.stringify(body) }),
  recordConsent: (version: string) => request('/privacy/consent', { method: 'POST', body: JSON.stringify({ version }) }),
  getConsentStatus: (version?: string) => request(`/privacy/consent/status${version ? `?version=${encodeURIComponent(version)}` : ''}`),
  downloadMyData: () => request('/privacy/me/export'),
  requestAccountDeletion: (reason: string) => request('/privacy/me/deletion-request', { method: 'POST', body: JSON.stringify({ reason }) }),
  listPrivacyRequestsAdmin: (status?: string) => request(`/admin/privacy-requests${status ? `?status=${status}` : ''}`),
  verifyPrivacyRequestAdmin: (id: string, body: any) =>
    request(`/admin/privacy-requests/${id}/verify`, { method: 'POST', body: JSON.stringify(body) }),
  listSensitiveAccessLogsAdmin: (limit?: number) =>
    request(`/admin/audit/sensitive-access${limit ? `?limit=${limit}` : ''}`),

  // 24. Phase 8 (D) System Operations & Backups
  getSystemOverview: () => request('/admin/system/overview'),
  listBackups: () => request('/admin/system/backups'),
  recordBackupRun: (body: any) => request('/admin/system/backups/record', { method: 'POST', body: JSON.stringify(body) }),
};
