'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Cookie } from 'lucide-react';

import { usePathname } from 'next/navigation';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const consent = localStorage.getItem('grievease_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(consent);
        setAnalyticsEnabled(Boolean(parsed.analytics));
      } catch {
        setShowBanner(true);
      }
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(
      'grievease_cookie_consent',
      JSON.stringify({ essential: true, analytics: true, timestamp: new Date().toISOString() })
    );
    setAnalyticsEnabled(true);
    setShowBanner(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem(
      'grievease_cookie_consent',
      JSON.stringify({ essential: true, analytics: false, timestamp: new Date().toISOString() })
    );
    setAnalyticsEnabled(false);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  if (
    pathname &&
    (pathname.startsWith('/app') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/activate') ||
      pathname.startsWith('/recovery') ||
      pathname.startsWith('/account-help') ||
      pathname.startsWith('/offline') ||
      pathname.startsWith('/session-expired') ||
      pathname.startsWith('/guard') ||
      pathname.startsWith('/vendor'))
  ) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 bg-white rounded-2xl p-5 border border-[#E2E8F0] shadow-2xl animate-fade-in-up"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#00B894]/15 text-[#00846A] flex items-center justify-center shrink-0">
          <Cookie className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-[#1A1A2E] mb-1">Your Privacy &amp; Cookies</h4>
          <p className="text-xs text-[#718096] leading-relaxed mb-4">
            We use strictly essential cookies for system security and session routing. Optional
            analytics cookies help us optimize resolution workflows. See our{' '}
            <Link href="/cookies" className="text-[#00846A] underline hover:text-[#00B894]">
              Cookie Policy
            </Link>
            .
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 rounded-full bg-[#00B894] hover:bg-[#00A383] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Accept All
            </button>
            <button
              onClick={handleAcceptEssential}
              className="px-3.5 py-2 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#4A5568] text-xs font-medium transition-colors"
            >
              Essential Only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
