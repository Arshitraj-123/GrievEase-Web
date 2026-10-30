'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Cookie } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    try {
      const consent = localStorage.getItem('grievease_cookie_acknowledged');
      if (!consent) {
        setShowBanner(true);
      }
    } catch {}
  }, []);

  const handleUnderstood = () => {
    try {
      localStorage.setItem('grievease_cookie_acknowledged', 'true');
    } catch {}
    setShowBanner(false);
  };

  if (!showBanner) return null;

  if (
    pathname &&
    (pathname.startsWith('/app') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/guard') ||
      pathname.startsWith('/vendor'))
  ) {
    return null;
  }

  return (
    <aside
      aria-label="Essential Cookie Notice"
      className="fixed bottom-0 inset-x-0 z-50 bg-[#1A1A2E]/95 backdrop-blur-md text-white border-t border-slate-700 p-4 sm:p-5 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 max-w-3xl">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Strictly Essential Cookies Only</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300">
                Zero Tracking
              </span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              GrievEase uses strictly necessary session cookies for secure authentication and CSRF token protection. We never use advertising, behavioral tracking, or third-party cookies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end">
          <Link
            href="/cookies"
            className="text-xs text-slate-400 hover:text-white underline underline-offset-4 px-2 py-2"
          >
            Cookie Policy
          </Link>
          <button
            type="button"
            onClick={handleUnderstood}
            className="min-h-[40px] px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors shadow-md"
          >
            Understood
          </button>
        </div>
      </div>
    </aside>
  );
}
