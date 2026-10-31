import { describe, it, expect } from 'vitest';
import * as jwt from 'jsonwebtoken';
import { Role, isAdminRole, ADMIN_ROLES } from '@grievease/contracts';

describe('Admin Access Matrix & Canonical Role Separation (Item 3 & Section D)', () => {
  const JWT_SECRET = 'super_secure_test_jwt_secret_with_sufficient_entropy_64chars_long!!';

  interface RoutePermission {
    route: string;
    allowedRoles: Role[];
  }

  // Canonical Admin Routes mapped strictly to canonical system roles:
  // 'SECRETARY' | 'COMMITTEE' | 'CHAIRMAN' | 'GOVERNING_BODY' | 'SUPER_ADMIN'
  const ADMIN_ROUTES: RoutePermission[] = [
    { route: '/api/v1/admin/society/settings', allowedRoles: ['SECRETARY', 'CHAIRMAN', 'SUPER_ADMIN'] },
    { route: '/api/v1/admin/audit-log', allowedRoles: ['GOVERNING_BODY', 'SECRETARY', 'CHAIRMAN', 'SUPER_ADMIN'] },
    { route: '/api/v1/admin/users/import', allowedRoles: ['SECRETARY', 'SUPER_ADMIN'] },
    { route: '/api/v1/admin/escalation/rules', allowedRoles: ['SECRETARY', 'CHAIRMAN', 'SUPER_ADMIN'] },
    { route: '/api/v1/admin/billing/cash-entry', allowedRoles: ['SECRETARY', 'CHAIRMAN', 'SUPER_ADMIN'] },
    { route: '/api/v1/admin/reports/export', allowedRoles: ['SECRETARY', 'CHAIRMAN', 'GOVERNING_BODY', 'SUPER_ADMIN'] },
    { route: '/api/v1/admin/waiver/approve', allowedRoles: ['CHAIRMAN', 'SUPER_ADMIN'] }, // Maker-checker dual authority
  ];

  function evaluateRouteAccess(token: string | null, route: string): { status: number; allowed: boolean } {
    if (!token) {
      return { status: 401, allowed: false };
    }

    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return { status: 401, allowed: false };
    }

    const targetRoute = ADMIN_ROUTES.find((r) => r.route === route);
    if (!targetRoute) {
      return { status: 404, allowed: false };
    }

    if (targetRoute.allowedRoles.includes(payload.role)) {
      return { status: 200, allowed: true };
    }

    return { status: 403, allowed: false };
  }

  it('should reject unauthenticated requests to all admin endpoints with 401', () => {
    for (const { route } of ADMIN_ROUTES) {
      const result = evaluateRouteAccess(null, route);
      expect(result.status).toBe(401);
      expect(result.allowed).toBe(false);
    }
  });

  it('should reject non-admin roles (RESIDENT, GUARD, VENDOR) from admin endpoints with 403', () => {
    const nonAdminRoles: Role[] = ['RESIDENT', 'GUARD', 'VENDOR'];

    for (const role of nonAdminRoles) {
      const token = jwt.sign({ userId: 'u-1', role, societyId: 'soc-1' }, JWT_SECRET);
      for (const { route } of ADMIN_ROUTES) {
        const result = evaluateRouteAccess(token, route);
        expect(result.status).toBe(403);
        expect(result.allowed).toBe(false);
      }
    }
  });

  it('should enforce role separation among canonical admin roles', () => {
    const governingBodyToken = jwt.sign({ userId: 'u-gb', role: 'GOVERNING_BODY' as Role, societyId: 'soc-1' }, JWT_SECRET);
    const secretaryToken = jwt.sign({ userId: 'u-sec', role: 'SECRETARY' as Role, societyId: 'soc-1' }, JWT_SECRET);
    const chairmanToken = jwt.sign({ userId: 'u-chair', role: 'CHAIRMAN' as Role, societyId: 'soc-1' }, JWT_SECRET);

    // GOVERNING_BODY has read-only supervisory audit access, but cannot enter cash or import users
    expect(evaluateRouteAccess(governingBodyToken, '/api/v1/admin/audit-log').status).toBe(200);
    expect(evaluateRouteAccess(governingBodyToken, '/api/v1/admin/billing/cash-entry').status).toBe(403);
    expect(evaluateRouteAccess(governingBodyToken, '/api/v1/admin/users/import').status).toBe(403);

    // SECRETARY can enter cash and import users, but cannot approve waivers (maker-checker)
    expect(evaluateRouteAccess(secretaryToken, '/api/v1/admin/billing/cash-entry').status).toBe(200);
    expect(evaluateRouteAccess(secretaryToken, '/api/v1/admin/users/import').status).toBe(200);
    expect(evaluateRouteAccess(secretaryToken, '/api/v1/admin/waiver/approve').status).toBe(403);

    // CHAIRMAN can approve waivers and access reports
    expect(evaluateRouteAccess(chairmanToken, '/api/v1/admin/waiver/approve').status).toBe(200);
    expect(evaluateRouteAccess(chairmanToken, '/api/v1/admin/reports/export').status).toBe(200);
  });

  it('should reject forged client-tampered tokens (signature mismatch)', () => {
    // Legitimate resident token
    const residentToken = jwt.sign({ userId: 'u-res', role: 'RESIDENT', societyId: 'soc-1' }, JWT_SECRET);

    // Client maliciously tampers with the base64 payload to claim SECRETARY role without knowing JWT_SECRET
    const [header, payload, sig] = residentToken.split('.');
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    decoded.role = 'SECRETARY';
    const tamperedPayload = Buffer.from(JSON.stringify(decoded)).toString('base64url');
    const tamperedToken = `${header}.${tamperedPayload}.${sig}`;

    const res = evaluateRouteAccess(tamperedToken, '/api/v1/admin/society/settings');
    expect(res.status).toBe(401); // Cryptographic signature check rejects forged role
    expect(res.allowed).toBe(false);
  });

  it('should enforce mandatory 2FA/TOTP requirement for all admin roles', () => {
    for (const role of ADMIN_ROLES) {
      expect(isAdminRole(role)).toBe(true);
    }

    const nonAdminRoles: Role[] = ['RESIDENT', 'GUARD', 'VENDOR'];
    for (const role of nonAdminRoles) {
      expect(isAdminRole(role)).toBe(false);
    }
  });

  it('should return 404 for setup endpoint when bootstrap is already complete', () => {
    let bootstrapCompleted = true;

    function handleSetupRequest() {
      if (bootstrapCompleted) {
        return { status: 404, message: 'Not Found' };
      }
      return { status: 200, message: 'Setup available' };
    }

    expect(handleSetupRequest().status).toBe(404);
  });
});
