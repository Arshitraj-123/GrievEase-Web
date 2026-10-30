'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, ArrowUp, Globe } from 'lucide-react';
import { siteConfig } from '@/config/site';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { Locale } from '@/lib/i18n';

const LANGUAGES = [
  { code: 'EN', name: 'English' },
  { code: 'HI', name: 'हिंदी' },
];

export function Footer() {
  const { locale, setLocale } = useAccessibility();
  const currentLang = locale ? locale.toUpperCase() : 'EN';
  const pathname = usePathname();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLangChange = (code: string) => {
    const loc = code.toLowerCase() as Locale;
    setLocale(loc);
  };

  const getLocalizedHref = (href: string) => {
    if (locale === 'hi') {
      if (href.startsWith('#') || href.startsWith('http')) return href;
      return href === '/' ? '/hi' : `/hi${href}`;
    }
    return href;
  };

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
    <footer
      role="contentinfo"
      className="bg-[#1A1A2E] text-white/70 pt-16 pb-10 px-6 lg:px-12 border-t border-white/10"
    >
      <div className="max-w-[1300px] mx-auto">
        {/* Main Grid: 6 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-14">
          {/* Col 1: Brand Info & Socials */}
          <div className="lg:col-span-2">
            <Link href={getLocalizedHref('/')} className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00B894] to-[#00D4AA] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(0,184,148,0.3)]">
                <Building2 className="w-4.5 h-4.5" />
              </div>
              <span className="text-[22px] font-bold text-white tracking-tight group-hover:text-[#00B894] transition-colors">
                GrievEase
              </span>
            </Link>
            <p className="text-[13px] text-white/60 leading-relaxed max-w-[320px] mb-5">
              Building better residential communities through technology, accountability, and
              uncompromising transparency. Every grievance has an owner, a deadline, and a permanent record.
            </p>

            {/* App Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-6">
              <Link
                href="/download"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors border border-white/10"
              >
                <span> App Store</span>
              </Link>
              <Link
                href="/download"
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors border border-white/10"
              >
                <span>▶ Google Play</span>
              </Link>
            </div>

            {/* Social Links (only visible if URL is not empty) */}
            <div className="flex items-center gap-2.5">
              {siteConfig.socialUrls.twitter && (
                <a
                  href={siteConfig.socialUrls.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow GrievEase on X (Twitter)"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#00B894] text-white flex items-center justify-center transition-colors text-xs font-bold"
                >
                  𝕏
                </a>
              )}
              {siteConfig.socialUrls.linkedin && (
                <a
                  href={siteConfig.socialUrls.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Connect with GrievEase on LinkedIn"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#00B894] text-white flex items-center justify-center transition-colors text-xs font-bold"
                >
                  in
                </a>
              )}
              {siteConfig.socialUrls.instagram && (
                <a
                  href={siteConfig.socialUrls.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Follow GrievEase on Instagram"
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#00B894] text-white flex items-center justify-center transition-colors text-xs font-bold"
                >
                  ig
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Product */}
          <div>
            <div className="text-[13px] font-bold text-white uppercase tracking-wider mb-4">Product</div>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link href={getLocalizedHref('/features')} className="hover:text-[#00B894] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/how-it-works')} className="hover:text-[#00B894] transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/transparency')} className="hover:text-[#00B894] transition-colors">
                  Transparency Dashboard
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/track')} className="hover:text-[#00B894] transition-colors">
                  Track a Complaint
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/download')} className="hover:text-[#00B894] transition-colors">
                  Download App
                </Link>
              </li>
              {siteConfig.featureFlags.enablePricing && (
                <li>
                  <Link href="/pricing" className="hover:text-[#00B894] transition-colors">
                    Pricing
                  </Link>
                </li>
              )}
              {siteConfig.featureFlags.enableChangelog && (
                <li>
                  <Link href="/changelog" className="hover:text-[#00B894] transition-colors">
                    Changelog
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Modules */}
          <div>
            <div className="text-[13px] font-bold text-white uppercase tracking-wider mb-4">Modules</div>
            <ul className="space-y-2 text-[12.5px]">
              <li>
                <Link href={getLocalizedHref('/features#grievances')} className="hover:text-[#00B894] transition-colors">
                  Grievances &amp; SLA
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/features#visitors')} className="hover:text-[#00B894] transition-colors">
                  Visitors &amp; Cabs
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/features#noticeboard')} className="hover:text-[#00B894] transition-colors">
                  Noticeboard
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/features#staff')} className="hover:text-[#00B894] transition-colors">
                  Domestic Staff
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/features#amenities')} className="hover:text-[#00B894] transition-colors">
                  Amenity Booking
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/features#bills')} className="hover:text-[#00B894] transition-colors">
                  Maintenance Bills
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/features#sos')} className="hover:text-[#00B894] transition-colors">
                  Emergency SOS
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/features#guards')} className="hover:text-[#00B894] transition-colors">
                  Security Guards
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/features#directory')} className="hover:text-[#00B894] transition-colors">
                  Society Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Support */}
          <div>
            <div className="text-[13px] font-bold text-white uppercase tracking-wider mb-4">Support</div>
            <ul className="space-y-2.5 text-[13px]">
              <li>
                <Link href={getLocalizedHref('/faq')} className="hover:text-[#00B894] transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/contact')} className="hover:text-[#00B894] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/contact?type=demo')} className="hover:text-[#00B894] transition-colors">
                  Request Demo
                </Link>
              </li>
              <li>
                <Link href="/contact#emergency" className="hover:text-[#00B894] transition-colors">
                  Emergency Contacts
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Company & Legal */}
          <div>
            <div className="text-[13px] font-bold text-white uppercase tracking-wider mb-4">Company</div>
            <ul className="space-y-2.5 text-[13px] mb-6">
              <li>
                <Link href={getLocalizedHref('/about')} className="hover:text-[#00B894] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/testimonials')} className="hover:text-[#00B894] transition-colors">
                  Testimonials
                </Link>
              </li>
              {siteConfig.featureFlags.enableBlog && (
                <li>
                  <Link href="/blog" className="hover:text-[#00B894] transition-colors">
                    Blog
                  </Link>
                </li>
              )}
              {siteConfig.featureFlags.enableCareers && (
                <li>
                  <Link href="/careers" className="hover:text-[#00B894] transition-colors">
                    Careers
                  </Link>
                </li>
              )}
              {siteConfig.featureFlags.enablePress && (
                <li>
                  <Link href="/press" className="hover:text-[#00B894] transition-colors">
                    Press
                  </Link>
                </li>
              )}
            </ul>

            <div className="text-[13px] font-bold text-white uppercase tracking-wider mb-3">Legal</div>
            <ul className="space-y-2 text-[12.5px]">
              <li>
                <Link href={getLocalizedHref('/privacy')} className="hover:text-[#00B894] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/terms')} className="hover:text-[#00B894] transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/cookies')} className="hover:text-[#00B894] transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/security')} className="hover:text-[#00B894] transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link href={getLocalizedHref('/data-deletion')} className="hover:text-[#00B894] transition-colors">
                  Data Deletion
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-[12px] text-white/50">
          <div>© 2026 GrievEase. All rights reserved.</div>

          {/* India care badge using crisp SVG flag */}
          <div className="flex items-center gap-2">
            <span>Made with care in India</span>
            <svg
              className="w-4 h-3 rounded-xs border border-white/15 overflow-hidden inline-block"
              viewBox="0 0 640 480"
              aria-label="Flag of India"
            >
              <rect width="640" height="160" fill="#FF9933" />
              <rect y="160" width="640" height="160" fill="#FFFFFF" />
              <rect y="320" width="640" height="160" fill="#128807" />
              <circle cx="320" cy="240" r="32" fill="#000088" />
              <circle cx="320" cy="240" r="26" fill="#FFFFFF" />
              <circle cx="320" cy="240" r="6" fill="#000088" />
            </svg>
          </div>

          <div className="flex items-center gap-4">
            {/* Language switcher */}
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#00B894]" />
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLangChange(lang.code)}
                  className={`px-1.5 py-0.5 rounded text-[11px] transition-colors ${
                    currentLang === lang.code ? 'text-[#00B894] font-bold' : 'hover:text-white'
                  }`}
                >
                  {lang.code}
                </button>
              ))}
            </div>

            {/* Back to top button */}
            <button
              onClick={scrollToTop}
              aria-label="Scroll back to top of page"
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-[#00B894] text-white flex items-center justify-center transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
