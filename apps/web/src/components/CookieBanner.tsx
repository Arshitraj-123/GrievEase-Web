'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie } from 'lucide-react';
import { Button } from '@grievease/ui';
import { useAccessibility } from './AccessibilityProvider';

export function CookieBanner() {
  const { t } = useAccessibility();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const acknowledged = localStorage.getItem('grievease_cookie_acknowledged');
      if (!acknowledged) {
        setVisible(true);
      }
    } catch {}
  }, []);

  const handleAcknowledge = () => {
    try {
      localStorage.setItem('grievease_cookie_acknowledged', 'true');
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and Privacy Notice"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xl rounded-2xl p-4 animate-in fade-in slide-in-from-bottom duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 shrink-0 mt-0.5">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>{t.cms?.cookieTitle || 'Essential Cookies Only'}</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-normal">
              Zero Tracking
            </span>
          </h4>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.cms?.cookieDesc ||
              'GrievEase uses strictly necessary session cookies for authentication and CSRF security. We do not use advertising, tracking, or third-party cookies.'}
          </p>
          <div className="flex items-center justify-between pt-1">
            <a
              href="/cookies"
              className="text-[11px] text-teal-600 hover:underline font-semibold"
            >
              Learn More
            </a>
            <Button
              size="sm"
              onClick={handleAcknowledge}
              className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-7 px-3 rounded-lg font-bold"
            >
              {t.cms?.cookieAccept || 'Understood'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

