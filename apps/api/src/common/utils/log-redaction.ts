/**
 * Sensitive Data Log Redaction Utility
 * Sanitizes log arguments, error messages, and payload objects
 * so secrets are never printed to terminal, disk, or remote aggregators.
 */

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /passwd/i,
  /token/i,
  /secret/i,
  /pepper/i,
  /encryption_?key/i,
  /auth_?tag/i,
  /totp/i,
  /authorization/i,
  /cookie/i,
  /set-cookie/i,
  /activation_?code/i,
  /recovery_?code/i,
  /private_?key/i,
  /blind_?index/i,
];

const CONNECTION_STRING_REGEX = /([a-zA-Z]+:\/\/[^:]+:)([^@]+)(@.+)/g;
const BEARER_TOKEN_REGEX = /Bearer\s+([A-Za-z0-9_\-\.]+)/gi;

export function redactSecrets(data: any, depth = 0): any {
  if (depth > 8) return '[MAX_DEPTH_REACHED]';
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    let sanitized = data.replace(CONNECTION_STRING_REGEX, '$1[REDACTED_PASSWORD]$3');
    sanitized = sanitized.replace(BEARER_TOKEN_REGEX, 'Bearer [REDACTED_TOKEN]');
    return sanitized;
  }

  if (typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSecrets(item, depth + 1));
  }

  if (typeof data === 'object') {
    const redactedObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(data)) {
      if (SENSITIVE_KEY_PATTERNS.some((pat) => pat.test(key))) {
        redactedObj[key] = '[REDACTED]';
      } else {
        redactedObj[key] = redactSecrets(val, depth + 1);
      }
    }
    return redactedObj;
  }

  return data;
}

