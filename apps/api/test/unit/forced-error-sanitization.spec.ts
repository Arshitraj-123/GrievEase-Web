import { describe, it, expect, vi } from 'vitest';
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  MethodNotAllowedException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';

describe('Forced Error Sanitization & Leakage Defense (Item 15 & Section E)', () => {
  function executeFilterWithException(exception: unknown) {
    const filter = new HttpExceptionFilter();
    let capturedStatus = 0;
    let capturedJson: any = null;

    const mockResponse: any = {
      status: vi.fn((s: number) => {
        capturedStatus = s;
        return mockResponse;
      }),
      json: vi.fn((data: any) => {
        capturedJson = data;
        return mockResponse;
      }),
    };

    const mockRequest: any = {
      method: 'POST',
      url: '/api/v1/test-endpoint',
    };

    const mockHost: any = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };

    filter.catch(exception, mockHost);
    return { status: capturedStatus, body: capturedJson };
  }

  const FORBIDDEN_LEAK_PATTERNS = [
    /SELECT .* FROM/i,
    /syntax error/i,
    /relation ".*" does not exist/i,
    /at (?:[a-zA-Z0-9_$.]+\s+)?\(?[a-zA-Z]:\\/i,
    /at (?:[a-zA-Z0-9_$.]+\s+)?\(?\//i,
    /node_modules/i,
    /password/i,
    /pepper/i,
    /secret/i,
    /stack/i,
  ];

  function assertNoSensitiveLeaks(body: any) {
    const serialized = JSON.stringify(body);
    for (const pattern of FORBIDDEN_LEAK_PATTERNS) {
      expect(pattern.test(serialized)).toBe(false);
    }
    expect(body.referenceId).toBeDefined();
    expect(typeof body.referenceId).toBe('string');
    expect(body.referenceId.length).toBeGreaterThan(10);
    expect(body.code).toBeDefined();
  }

  it('should sanitize 400 Bad Request and malformed JSON errors', () => {
    const err = new BadRequestException('Unexpected token } in JSON at position 42');
    const res = executeFilterWithException(err);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('BAD_REQUEST');
    assertNoSensitiveLeaks(res.body);
  });

  it('should sanitize 401 Unauthorized errors', () => {
    const err = new UnauthorizedException('Authentication required');
    const res = executeFilterWithException(err);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
    assertNoSensitiveLeaks(res.body);
  });

  it('should sanitize 403 Forbidden errors', () => {
    const err = new ForbiddenException('You do not have permission to view flat 102');
    const res = executeFilterWithException(err);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
    assertNoSensitiveLeaks(res.body);
  });

  it('should sanitize 404 Not Found errors', () => {
    const err = new NotFoundException('Grievance grv-9999 not found');
    const res = executeFilterWithException(err);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    assertNoSensitiveLeaks(res.body);
  });

  it('should sanitize 405 Method Not Allowed errors', () => {
    const err = new MethodNotAllowedException('PATCH method is not allowed');
    const res = executeFilterWithException(err);

    expect(res.status).toBe(405);
    expect(res.body.code).toBe('METHOD_NOT_ALLOWED');
    assertNoSensitiveLeaks(res.body);
  });

  it('should sanitize 413 Payload Too Large errors', () => {
    const err = new PayloadTooLargeException('File size 15MB exceeds limit 5MB');
    const res = executeFilterWithException(err);

    expect(res.status).toBe(413);
    expect(res.body.code).toBe('PAYLOAD_TOO_LARGE');
    assertNoSensitiveLeaks(res.body);
  });

  it('should sanitize 415 Unsupported Media Type errors', () => {
    const err = new UnsupportedMediaTypeException('Executable files are not allowed');
    const res = executeFilterWithException(err);

    expect(res.status).toBe(415);
    expect(res.body.code).toBe('UNSUPPORTED_MEDIA_TYPE');
    assertNoSensitiveLeaks(res.body);
  });

  it('should sanitize 429 Too Many Requests errors', () => {
    const err = new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    const res = executeFilterWithException(err);

    expect(res.status).toBe(429);
    expect(res.body.code).toBe('TOO_MANY_REQUESTS');
    assertNoSensitiveLeaks(res.body);
  });

  it('should intercept raw database crash without leaking SQL or schema internals', () => {
    const rawDbError = new Error('error: relation "society_secret_audit" does not exist at character 15 in SELECT * FROM society_secret_audit WHERE password = "abc"');
    (rawDbError as any).stack = 'Error: relation "society_secret_audit" does not exist\n    at Connection.parseE (C:\\Users\\admin\\app\\node_modules\\pg\\lib\\connection.js:614:13)';

    const res = executeFilterWithException(rawDbError);

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_SERVER_ERROR');
    // Must NOT contain the raw table name, SQL, or filepath
    expect(res.body.message).not.toContain('society_secret_audit');
    expect(res.body.message).not.toContain('SELECT');
    expect(res.body.message).not.toContain('connection.js');
    assertNoSensitiveLeaks(res.body);
  });

  it('should intercept raw Redis disconnection error without leaking host or credentials', () => {
    const rawRedisError = new Error('Connection lost to redis://:superSecretRedisPassword@redis-cluster.internal:6379');
    const res = executeFilterWithException(rawRedisError);

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.message).not.toContain('superSecretRedisPassword');
    expect(res.body.message).not.toContain('redis-cluster.internal');
    assertNoSensitiveLeaks(res.body);
  });

  it('should intercept MinIO S3 storage timeout without leaking S3 endpoint or keys', () => {
    const rawS3Error = new Error('Timeout connecting to minio:9000 with accessKey MINIO_ROOT_USER_ADMIN');
    const res = executeFilterWithException(rawS3Error);

    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.message).not.toContain('MINIO_ROOT_USER_ADMIN');
    assertNoSensitiveLeaks(res.body);
  });
});
