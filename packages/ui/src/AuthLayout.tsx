'use client';

import React from 'react';
import { cn } from './utils';
import { BrandPanel } from './BrandPanel';
import { LanguageSwitcher, SupportedLocale } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { Building2, ArrowLeft } from 'lucide-react';

export interface AuthLayoutProps {
  children: React.ReactNode;
  currentLocale?: SupportedLocale;
  onLocaleChange?: (locale: SupportedLocale) => void;
  theme?: 'light' | 'dark';
  onThemeToggle?: (theme: 'light' | 'dark') => void;
  className?: string;
  formClassName?: string;
  hideBrandPanel?: boolean;
  LinkComponent?: React.ComponentType<any>;
}

export function AuthLayout({
  children,
  currentLocale = 'en',
  onLocaleChange = () => {},
  theme,
  onThemeToggle,
  className,
  formClassName,
  hideBrandPanel = false,
  LinkComponent,
}: AuthLayoutProps) {
  // Render Link using provided component (e.g. Next.js Link) or fallback to <a>
  const renderLink = (href: string, text: React.ReactNode, extraClass?: string) => {
    if (LinkComponent) {
      const LinkEl = LinkComponent;
      return (
        <LinkEl href={href} className={extraClass}>
          {text}
        </LinkEl>
      );
    }
    return (
      <a href={href} className={extraClass}>
        {text}
      </a>
    );
  };

  return (
    <div
      className={cn(
        'min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors',
        className
      )}
    >
      {/* Desktop Left Brand Panel (45%) */}
      {!hideBrandPanel && <BrandPanel />}

      {/* Right Form Panel (55% desktop, 100% mobile/tablet) */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto min-h-screen">
        {/* Top Bar: Brand Logo (mobile) + Language Switcher + Theme Toggle */}
        <header className="w-full flex items-center justify-between pb-4 sm:pb-6 border-b border-slate-200/80 dark:border-slate-800">
          {/* Logo link to home */}
          <div>
            {renderLink(
              '/',
              <div className="inline-flex items-center gap-2 group min-h-[44px]">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-sm shadow-teal-600/30 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-none block">
                    Griev<span className="text-teal-600 dark:text-teal-400">Ease</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider hidden sm:block">
                    Resident &amp; Society Portal
                  </span>
                </div>
              </div>,
              'focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-xl'
            )}
          </div>

          {/* Controls: Language Switcher and Light/Dark Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher
              currentLocale={currentLocale}
              onLocaleChange={onLocaleChange}
            />
            <ThemeToggle
              theme={theme}
              onThemeToggle={onThemeToggle}
            />
          </div>
        </header>

        {/* Centered Main Form Container (360px mobile first, max-w-md on desktop) */}
        <main
          id="auth-main-content"
          className={cn(
            'w-full max-w-full sm:max-w-md mx-auto my-auto py-6 sm:py-8 flex flex-col justify-center',
            formClassName
          )}
        >
          {children}

          {/* Mobile Collapsed Brand Strip */}
          {!hideBrandPanel && (
            <div className="lg:hidden mt-6">
              <BrandPanel collapsed />
            </div>
          )}
        </main>

        {/* Form Panel Footer */}
        <footer className="w-full pt-6 border-t border-slate-200/80 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            {renderLink(
              '/privacy',
              'Privacy Policy',
              'hover:text-teal-600 dark:hover:text-teal-400 underline underline-offset-4 min-h-[32px] inline-flex items-center'
            )}
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              &bull;
            </span>
            {renderLink(
              '/terms',
              'Terms of Service',
              'hover:text-teal-600 dark:hover:text-teal-400 underline underline-offset-4 min-h-[32px] inline-flex items-center'
            )}
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              &bull;
            </span>
            {renderLink(
              '/account-help',
              'Help & Support',
              'hover:text-teal-600 dark:hover:text-teal-400 underline underline-offset-4 min-h-[32px] inline-flex items-center'
            )}
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              &bull;
            </span>
            {renderLink(
              '/',
              <span className="inline-flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to home</span>
              </span>,
              'hover:underline min-h-[32px] inline-flex items-center'
            )}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            &copy; {new Date().getFullYear()} GrievEase. Autonomous Society Governance. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
