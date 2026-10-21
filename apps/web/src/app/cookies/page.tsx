import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy — GrievEase',
  description:
    'Understand how GrievEase utilizes essential session cookies and optional analytics cookies to protect your session and optimize resolution telemetry.',
  alternates: {
    canonical: '/cookies',
  },
};

export default function CookiesPage() {
  return (
    <div className="py-16 px-6 lg:px-12 bg-white">
      <div className="max-w-[850px] mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A2E] mb-3">
          Cookie Policy
        </h1>
        <p className="text-xs text-[#718096] mb-8">Effective Date: October 21, 2026</p>

        <div className="space-y-6 text-sm text-[#4A5568] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">1. What Are Cookies?</h2>
            <p>
              Cookies are small text files placed on your computer or mobile device when you browse websites.
              They are widely used to maintain security, keep you logged into your resident portal, and remember
              preferences such as your selected language (English, Hindi, Marathi).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">2. Types of Cookies We Use</h2>
            <div className="space-y-3 mt-3">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="font-bold text-[#1A1A2E]">Strictly Essential Cookies</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Required for site operation, authentication tokens, CSRF protection, and language
                  selection (<code>grievease_locale</code>). These cookies cannot be turned off.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <h3 className="font-bold text-[#1A1A2E]">Analytics &amp; Performance Cookies</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Help us understand how users navigate through grievance workflows, identifying bugs and
                  slow loading pages. These are disabled by default unless you explicitly opt in via our
                  cookie consent banner.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">3. Managing Your Preferences</h2>
            <p>
              You can reset or change your cookie preferences at any time by clearing your browser cache
              or reviewing our{' '}
              <Link href="/privacy" className="text-[#00846A] underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
