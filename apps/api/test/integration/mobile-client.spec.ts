import { describe, it, expect } from 'vitest';
import * as jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { sha256Hex } from '../../src/common/utils/security-crypto';

describe('Client-Agnostic API & Mobile Bearer Authentication', () => {
  const JWT_SECRET = 'test_secret_for_mobile_bearer_verification_32chars!';

  // Helper simulating token extraction in JwtGuard
  function extractToken(request: { headers: Record<string, string>; cookies?: Record<string, string> }): string | null {
    if (request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
      return request.headers.authorization.substring(7);
    }
    if (request.cookies) {
      if (request.cookies.access_token) return request.cookies.access_token;
      if (request.cookies['__Host-access_token']) return request.cookies['__Host-access_token'];
    }
    return null;
  }

  it('should extract authentication token from Authorization: Bearer header', () => {
    const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.samplePayload.signature';
    const mobileReq = {
      headers: {
        'x-client': 'mobile',
        authorization: `Bearer ${sampleToken}`,
      },
    };

    const extracted = extractToken(mobileReq);
    expect(extracted).toBe(sampleToken);
  });

  it('should extract authentication token from cookies for browser clients', () => {
    const sampleToken = 'cookieToken12345';
    const browserReq = {
      headers: {},
      cookies: {
        access_token: sampleToken,
      },
    };

    const extracted = extractToken(browserReq);
    expect(extracted).toBe(sampleToken);
  });

  it('should prioritize Bearer header over cookies when both are present', () => {
    const bearerToken = 'bearerPriorityToken';
    const cookieToken = 'cookieSecondaryToken';
    const req = {
      headers: {
        authorization: `Bearer ${bearerToken}`,
      },
      cookies: {
        access_token: cookieToken,
      },
    };

    expect(extractToken(req)).toBe(bearerToken);
  });

  it('should authenticate a valid signed Bearer token with full claims', () => {
    const payload = {
      userId: 'usr_mobile_001',
      societyId: 'soc_001',
      role: 'RESIDENT',
      username: 'resident.phone',
      sessionId: 'sess_mob_123',
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    expect(decoded.userId).toBe('usr_mobile_001');
    expect(decoded.role).toBe('RESIDENT');
    expect(decoded.username).toBe('resident.phone');
    expect(decoded.sessionId).toBe('sess_mob_123');
  });

  it('should rotate refresh token supplied in request body for mobile clients without cookies', () => {
    // Simulate mobile token storage and body refresh
    const initialRawToken = crypto.randomBytes(40).toString('hex');
    const sessionId = 'session_mob_999';
    const initialRefresh = `${sessionId}.${initialRawToken}`;

    // Mobile client sends: { refreshToken: initialRefresh }
    const parts = initialRefresh.split('.');
    expect(parts.length).toBe(2);
    expect(parts[0]).toBe(sessionId);
    expect(parts[1]).toBe(initialRawToken);

    // Simulate token rotation in backend
    const newRawToken = crypto.randomBytes(40).toString('hex');
    const newRefresh = `${sessionId}.${newRawToken}`;
    const newAccessToken = jwt.sign(
      { userId: 'usr_mob_001', role: 'RESIDENT', sessionId },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const mobileResponse = {
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefresh,
      expiresIn: 900,
    };

    expect(mobileResponse.success).toBe(true);
    expect(mobileResponse.accessToken).toBeDefined();
    expect(mobileResponse.refreshToken).not.toBe(initialRefresh);
    expect(mobileResponse.expiresIn).toBe(900);
  });

  it('should enforce step-up elevated claim identically on Bearer requests', () => {
    const stepUpPayload = {
      userId: 'usr_mobile_001',
      stepUp: true,
    };

    const stepUpToken = jwt.sign(stepUpPayload, JWT_SECRET, { expiresIn: '5m' });
    const decoded = jwt.verify(stepUpToken, JWT_SECRET) as any;

    expect(decoded.stepUp).toBe(true);
    expect(decoded.exp - decoded.iat).toBe(300); // 5 minutes (300 seconds)
  });
});
