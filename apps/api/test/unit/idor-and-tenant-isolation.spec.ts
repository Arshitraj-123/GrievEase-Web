import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('IDOR & Multi-Tenant Isolation Enforcement (Item 4)', () => {
  const SIGNING_SECRET = 'signed_url_test_secret_for_secure_storage_32bytes!';

  interface GrievanceRecord {
    id: string;
    society_id: string;
    created_by_user_id: string;
    title: string;
    is_anonymous: boolean;
  }

  const mockDatabase: GrievanceRecord[] = [
    { id: 'grv-soc1-u1', society_id: 'society-alpha', created_by_user_id: 'user-resident-1', title: 'Water leakage', is_anonymous: false },
    { id: 'grv-soc1-u2', society_id: 'society-alpha', created_by_user_id: 'user-resident-2', title: 'Noise complaint', is_anonymous: true },
    { id: 'grv-soc2-u3', society_id: 'society-beta', created_by_user_id: 'user-resident-3', title: 'Elevator maintenance', is_anonymous: false },
  ];

  function queryGrievance(actor: { userId: string; societyId: string; role: string }, grievanceId: string) {
    const item = mockDatabase.find((g) => g.id === grievanceId);
    if (!item) {
      return { status: 404, error: 'Not Found' };
    }

    // Society-level Row-Level Security check
    if (item.society_id !== actor.societyId) {
      // Must not leak existence of resources in other societies
      return { status: 404, error: 'Not Found' };
    }

    // Role-level data isolation
    if (actor.role === 'RESIDENT') {
      if (item.created_by_user_id !== actor.userId) {
        return { status: 403, error: 'Access denied: You can only view your own grievances' };
      }
    }

    return { status: 200, data: item };
  }

  function generateSignedUrl(objectKey: string, expiresInSeconds: number): string {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const hmac = crypto.createHmac('sha256', SIGNING_SECRET);
    hmac.update(`${objectKey}:${expiresAt}`);
    const signature = hmac.digest('hex');
    return `/storage/download?key=${encodeURIComponent(objectKey)}&expires=${expiresAt}&sig=${signature}`;
  }

  function verifySignedUrl(url: string): { valid: boolean; reason?: string } {
    const parsed = new URL(url, 'https://localhost');
    const key = parsed.searchParams.get('key');
    const expiresStr = parsed.searchParams.get('expires');
    const sig = parsed.searchParams.get('sig');

    if (!key || !expiresStr || !sig) {
      return { valid: false, reason: 'Missing signature parameters' };
    }

    const expiresAt = parseInt(expiresStr, 10);
    if (Math.floor(Date.now() / 1000) > expiresAt) {
      return { valid: false, reason: 'Signed URL has expired' };
    }

    const hmac = crypto.createHmac('sha256', SIGNING_SECRET);
    hmac.update(`${key}:${expiresAt}`);
    const expectedSig = hmac.digest('hex');

    const valid = crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSig, 'hex'));
    return { valid, reason: valid ? undefined : 'Invalid signature' };
  }

  it('should prevent cross-society data access (tenant isolation)', () => {
    const actorAlpha = { userId: 'user-resident-1', societyId: 'society-alpha', role: 'RESIDENT' };
    // Alpha resident attempting to access Beta society grievance
    const res = queryGrievance(actorAlpha, 'grv-soc2-u3');
    expect(res.status).toBe(404);
  });

  it('should prevent cross-resident IDOR within the same society', () => {
    const resident1 = { userId: 'user-resident-1', societyId: 'society-alpha', role: 'RESIDENT' };
    // Resident 1 attempting to view Resident 2's grievance
    const res = queryGrievance(resident1, 'grv-soc1-u2');
    expect(res.status).toBe(403);
    expect(res.error).toContain('You can only view your own grievances');
  });

  it('should allow residents to view their own grievance', () => {
    const resident1 = { userId: 'user-resident-1', societyId: 'society-alpha', role: 'RESIDENT' };
    const res = queryGrievance(resident1, 'grv-soc1-u1');
    expect(res.status).toBe(200);
    expect(res.data?.id).toBe('grv-soc1-u1');
  });

  it('should allow society secretary to view grievances within their society only', () => {
    const secretaryAlpha = { userId: 'sec-alpha', societyId: 'society-alpha', role: 'SECRETARY' };
    
    // Can view grievances in Society Alpha
    const res1 = queryGrievance(secretaryAlpha, 'grv-soc1-u1');
    expect(res1.status).toBe(200);

    const res2 = queryGrievance(secretaryAlpha, 'grv-soc1-u2');
    expect(res2.status).toBe(200);

    // Cannot view grievances in Society Beta
    const res3 = queryGrievance(secretaryAlpha, 'grv-soc2-u3');
    expect(res3.status).toBe(404);
  });

  it('should validate signed URLs and reject expired or tampered links', () => {
    const validUrl = generateSignedUrl('evidence/leak-photo.jpg', 300);
    expect(verifySignedUrl(validUrl).valid).toBe(true);

    // Tampered object key
    const tamperedKeyUrl = validUrl.replace('leak-photo.jpg', 'confidential-audit.pdf');
    expect(verifySignedUrl(tamperedKeyUrl).valid).toBe(false);

    // Tampered expiry date
    const tamperedExpiryUrl = validUrl.replace(/expires=\d+/, 'expires=9999999999');
    expect(verifySignedUrl(tamperedExpiryUrl).valid).toBe(false);

    // Expired URL
    const expiredUrl = generateSignedUrl('evidence/old-photo.jpg', -10);
    const expiredCheck = verifySignedUrl(expiredUrl);
    expect(expiredCheck.valid).toBe(false);
    expect(expiredCheck.reason).toContain('expired');
  });
});

