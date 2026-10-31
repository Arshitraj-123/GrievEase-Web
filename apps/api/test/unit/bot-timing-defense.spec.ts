import { describe, it, expect } from 'vitest';

describe('Bot Timing & Autofill Discrimination Defense (Item 6 & Section F)', () => {
  // Simulates request handler logic across auth vs public anonymous forms
  function processFormSubmission(formType: 'LOGIN' | 'ACTIVATE' | 'RECOVERY' | 'PUBLIC_CONTACT', payload: {
    elapsedMs: number;
    honeypot?: string;
    username?: string;
    password?: string;
  }): { allowed: boolean; reason?: string } {
    // 1. Critical Rule: Authentication & recovery endpoints MUST NOT enforce minimum submission duration
    // Password managers (Bitwarden, 1Password, Apple Keychain) autofill and submit in < 100ms.
    if (formType === 'LOGIN' || formType === 'ACTIVATE' || formType === 'RECOVERY') {
      // Login relies strictly on credentials check, rate limiting, lockout, and PoW puzzle
      return { allowed: true };
    }

    // 2. Public Anonymous Forms (e.g. Public Contact / Feedback) enforce honeypot & timing checks
    if (formType === 'PUBLIC_CONTACT') {
      if (payload.honeypot && payload.honeypot.trim().length > 0) {
        return { allowed: false, reason: 'Honeypot trap triggered by automated crawler.' };
      }
      if (payload.elapsedMs < 1500) {
        return { allowed: false, reason: 'Form submitted unnaturally fast (< 1.5s). Automated bot suspected.' };
      }
      return { allowed: true };
    }

    return { allowed: true };
  }

  it('should accept instant login submissions (< 50ms) from password managers without timing rejection', () => {
    const instantAutofillPayload = {
      username: 'resident_aarav',
      password: 'mock_autofill_password_Strong123!',
      elapsedMs: 35, // 35 ms from password manager
    };

    const result = processFormSubmission('LOGIN', instantAutofillPayload);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('should accept instant account activation (< 100ms) without timing rejection', () => {
    const instantActivation = {
      username: 'new_resident',
      password: 'mock_activation_password_Strong123!',
      elapsedMs: 80,
    };

    const result = processFormSubmission('ACTIVATE', instantActivation);
    expect(result.allowed).toBe(true);
  });

  it('should accept instant account recovery code submission (< 50ms) without timing rejection', () => {
    const instantRecovery = {
      username: 'resident_aarav',
      elapsedMs: 40,
    };

    const result = processFormSubmission('RECOVERY', instantRecovery);
    expect(result.allowed).toBe(true);
  });

  it('should reject automated bots on public anonymous contact forms submitting in < 1.5s', () => {
    const fastBotContact = {
      elapsedMs: 450, // Fast script
      honeypot: '',
    };

    const res = processFormSubmission('PUBLIC_CONTACT', fastBotContact);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Form submitted unnaturally fast');
  });

  it('should reject bots filling the honeypot field on public contact forms', () => {
    const honeypotBot = {
      elapsedMs: 3000,
      honeypot: 'http://spam-promotions.example.com',
    };

    const res = processFormSubmission('PUBLIC_CONTACT', honeypotBot);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('Honeypot trap triggered');
  });

  it('should accept legitimate human submissions on public forms (> 1.5s and untouched honeypot)', () => {
    const legitimateSubmission = {
      elapsedMs: 4200,
      honeypot: '',
    };

    const res = processFormSubmission('PUBLIC_CONTACT', legitimateSubmission);
    expect(res.allowed).toBe(true);
  });
});
