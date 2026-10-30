'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@grievease/ui';
import { api } from '@/lib/api-client';
import { useAccessibility } from './AccessibilityProvider';

export function PrivacyConsentModal() {
  const { t } = useAccessibility();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Only check if user is logged in
    api.getConsentStatus('2026.1')
      .then((res) => {
        if (!res?.accepted) {
          setShowModal(true);
        }
      })
      .catch(() => {
        // Not logged in or public page; ignore
      });
  }, []);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await api.recordConsent('2026.1');
      setShowModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to record consent');
    } finally {
      setSubmitting(false);
    }
  };

  if (!showModal) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dpdp-consent-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 id="dpdp-consent-title" className="text-sm font-bold text-slate-900 dark:text-white">
              {t.privacy?.consentBannerTitle || 'Statutory Privacy & Data Processing Notice'}
            </h3>
            <p className="text-[11px] text-slate-500">
              Digital Personal Data Protection Act, 2023 Compliance &bull; Version 2026.1
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
          <p>
            {t.privacy?.consentBannerDesc ||
              'By continuing, you acknowledge that your personal data (name, flat association, emergency contacts, gate entries, and payment records) is collected and processed solely for housing society administration, safety verification, and accounting purposes.'}
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
            <li>Zero commercial marketing or third-party tracking cookies</li>
            <li>Immutable audit logs protect financial and grievance records</li>
            <li>Anonymous grievances keep your identity cryptographically hidden</li>
          </ul>
        </div>

        <div className="flex items-center justify-between pt-2">
          <a
            href="/privacy"
            target="_blank"
            className="text-xs text-teal-600 hover:underline font-semibold"
          >
            Review Full Policy
          </a>
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={submitting}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md"
          >
            {submitting ? 'Recording...' : t.privacy?.agreeAndContinue || 'I Agree & Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
}

