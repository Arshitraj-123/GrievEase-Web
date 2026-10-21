'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Menu, X, Globe, ChevronDown } from 'lucide-react';
import { siteConfig } from '@/config/site';

const LANGUAGES = [
  { code: 'EN', name: 'English' },
  { code: 'HI', name: 'हिंदी' },
  { code: 'MR', name: 'मराठी' },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('EN');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Read saved locale cookie on mount
    const match = document.cookie.match(/(?:^|; )grievease_locale=([^;]*)/);
    if (match && match[1]) {
      setCurrentLang(match[1]);
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const changeLanguage = (code: string) => {
    setCurrentLang(code);
    document.cookie = `grievease_locale=${code}; path=/; max-age=31536000; SameSite=Lax`;
    setLangDropdownOpen(false);
  };

  const isNavActive = (href: string) => {
    if (!pathname) return false;
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <header
      role="banner"
      className={`sticky top-0 z-50 transition-all duration-300 flex items-center justify-between px-6 lg:px-12 ${
        isScrolled
          ? 'h-[64px] bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-[0_2px_20px_rgba(0,0,0,0.06)]'
          : 'h-[72px] bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]/80'
      }`}
    >
      {/* Brand Logo */}
      <Link
        href="/"
        className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894] rounded-lg"
        aria-label="GrievEase Home"
      >
        <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-[#00B894] to-[#00D4AA] flex items-center justify-center shadow-[0_4px_12px_rgba(0,184,148,0.3)] transition-transform duration-300 group-hover:scale-105">
          <Building2 className="w-4.5 h-4.5 text-white" />
          <span
            className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full flex items-center justify-center text-[7px] font-bold text-white"
            aria-hidden="true"
          >
            1
          </span>
        </div>
        <span className="text-[22px] font-bold tracking-tight text-[#1A1A2E] group-hover:text-[#00B894] transition-colors">
          GrievEase
        </span>
      </Link>

      {/* Desktop Nav Links (Hidden below 1024px) */}
      <nav
        role="navigation"
        aria-label="Main Navigation"
        className="hidden lg:flex items-center gap-7 text-[14px] font-medium text-[#4A5568]"
      >
        {siteConfig.navItems.map((item) => {
          const active = isNavActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative py-1 transition-colors hover:text-[#00B894] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894] rounded ${
                active
                  ? 'text-[#00B894] font-semibold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#00B894] after:rounded-full'
                  : ''
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right Desktop Actions (Hidden below 1024px) */}
      <div className="hidden lg:flex items-center gap-3.5">
        {/* Language Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-[#E2E8F0] text-[12.5px] font-medium text-[#4A5568] hover:text-[#00B894] hover:border-[#00B894]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
            aria-label="Select language"
            aria-expanded={langDropdownOpen}
          >
            <Globe className="w-3.5 h-3.5 text-[#00B894]" />
            <span>{currentLang}</span>
            <ChevronDown className="w-3 h-3 text-[#94A3B8]" />
          </button>

          {langDropdownOpen && (
            <div
              className="absolute right-0 mt-1.5 w-32 bg-white rounded-xl border border-[#E2E8F0] shadow-lg py-1 z-50"
              role="menu"
            >
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between hover:bg-[#F0FAF7] hover:text-[#00B894] transition-colors ${
                    currentLang === lang.code ? 'font-bold text-[#00B894] bg-[#F0FAF7]/60' : 'text-[#4A5568]'
                  }`}
                  role="menuitem"
                >
                  <span>{lang.name}</span>
                  <span className="text-[10px] text-[#94A3B8]">{lang.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Login Button */}
        <Link
          href="/login"
          className="px-5 py-2 rounded-full border-[1.5px] border-[#00B894] text-[#00B894] bg-transparent text-[14px] font-semibold hover:bg-[#00B894] hover:text-white transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
        >
          Login
        </Link>

        {/* Get Started Button */}
        <Link
          href="/join"
          className="px-5 py-2 rounded-full bg-gradient-to-r from-[#00B894] to-[#00D4AA] text-white text-[14px] font-semibold shadow-[0_4px_15px_rgba(0,184,148,0.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,184,148,0.45)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
        >
          Get Started
        </Link>
      </div>

      {/* Mobile Right Controls: Language & Hamburger Button (visible below 1024px) */}
      <div className="flex lg:hidden items-center gap-2">
        {/* Mobile Language Switcher */}
        <button
          onClick={() => {
            const nextIdx = (LANGUAGES.findIndex((l) => l.code === currentLang) + 1) % LANGUAGES.length;
            changeLanguage(LANGUAGES[nextIdx].code);
          }}
          className="px-2.5 py-1 rounded-full border border-[#E2E8F0] text-[12px] font-medium text-[#4A5568] flex items-center gap-1"
          aria-label="Toggle language"
        >
          <Globe className="w-3.5 h-3.5 text-[#00B894]" />
          <span>{currentLang}</span>
        </button>

        {/* Hamburger Drawer Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          className="w-10 h-10 rounded-full border border-[#E2E8F0] flex items-center justify-center text-[#4A5568] hover:text-[#00B894] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer (visible when mobileMenuOpen is true) */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden absolute top-[100%] left-0 right-0 bg-white border-b border-[#E2E8F0] px-6 py-5 shadow-xl z-50 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <nav className="flex flex-col gap-3.5 text-[15px] font-medium text-[#4A5568]">
            {siteConfig.navItems.map((item) => {
              const active = isNavActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-1.5 px-2 rounded-lg transition-colors ${
                    active ? 'text-[#00B894] font-bold bg-[#F0FAF7]' : 'hover:text-[#00B894] hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <div className="pt-3 border-t border-[#E2E8F0] flex flex-col gap-2.5">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full border-[1.5px] border-[#00B894] text-[#00B894] font-semibold hover:bg-[#F0FAF7] transition-colors"
              >
                Login
              </Link>
              <Link
                href="/join"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-full bg-gradient-to-r from-[#00B894] to-[#00D4AA] text-white font-semibold shadow-[0_4px_15px_rgba(0,184,148,0.35)]"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
