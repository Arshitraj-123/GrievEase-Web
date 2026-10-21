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
  verifyAuditChain: () => request('/audit/verify'),
  getLatestAuditHash: () => request('/audit/latest-hash'),

  // 6. In-App Notifications
  getNotifications: () => request<{ items: any[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),
};
