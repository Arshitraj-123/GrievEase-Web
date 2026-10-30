'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Locale, TranslationStructure, getFullDictionary, getStoredLocale, setStoredLocale } from '@/lib/i18n';
import { api } from '@/lib/api-client';

export type FontSizeSetting = 'normal' | 'large' | 'xlarge';

interface AccessibilityContextType {
  fontSize: FontSizeSetting;
  setFontSize: (size: FontSizeSetting) => Promise<void>;
  locale: Locale;
  setLocale: (loc: Locale) => Promise<void>;
  t: TranslationStructure;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const FONT_SIZE_MAP: Record<FontSizeSetting, string> = {
  normal: '16px',
  large: '18px',
  xlarge: '20px',
};

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSizeSetting>('normal');
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Initialise locale from URL / cookie / localStorage
    let savedLocale = getStoredLocale();
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname === '/hi' || pathname.startsWith('/hi/')) {
        savedLocale = 'hi';
        setStoredLocale('hi');
      }
    }
    setLocaleState(savedLocale);
    // Sync <html lang> attribute on initial mount
    document.documentElement.lang = savedLocale;

    const handleLocaleChange = () => {
      const current = getStoredLocale();
      setLocaleState(current);
      document.documentElement.lang = current;
    };
    window.addEventListener('grievease_locale_change', handleLocaleChange);
    window.addEventListener('storage', handleLocaleChange);

    // 2. Initialise font size from localStorage
    const savedFontSize = (localStorage.getItem('grievease_font_size') as FontSizeSetting) || 'normal';
    if (['normal', 'large', 'xlarge'].includes(savedFontSize)) {
      setFontSizeState(savedFontSize);
      document.documentElement.style.fontSize = FONT_SIZE_MAP[savedFontSize];
      document.documentElement.setAttribute('data-font-size', savedFontSize);
    } else {
      document.documentElement.style.fontSize = '16px';
    }

    // 3. Try to fetch user preferences if authenticated
    api.getProfile()
      .then((profile) => {
        if (profile) {
          if (profile.language && ['en', 'hi'].includes(profile.language)) {
            setLocaleState(profile.language);
            setStoredLocale(profile.language);
            document.documentElement.lang = profile.language;
          }
          if (profile.fontSize && ['normal', 'large', 'xlarge'].includes(profile.fontSize)) {
            setFontSizeState(profile.fontSize);
            localStorage.setItem('grievease_font_size', profile.fontSize);
            document.documentElement.style.fontSize = FONT_SIZE_MAP[profile.fontSize as FontSizeSetting];
            document.documentElement.setAttribute('data-font-size', profile.fontSize);
          }
        }
      })
      .catch(() => {
        // Unauthenticated or offline; fallback silently to stored defaults
      });

    setMounted(true);
    return () => {
      window.removeEventListener('grievease_locale_change', handleLocaleChange);
      window.removeEventListener('storage', handleLocaleChange);
    };
  }, []);

  const handleSetFontSize = async (size: FontSizeSetting) => {
    setFontSizeState(size);
    if (typeof window !== 'undefined') {
      localStorage.setItem('grievease_font_size', size);
      document.documentElement.style.fontSize = FONT_SIZE_MAP[size];
      document.documentElement.setAttribute('data-font-size', size);
    }
    try {
      await api.updatePreferences({ fontSize: size });
    } catch {
      // Offline / guest mode tolerance
    }
  };

  const handleSetLocale = async (loc: Locale) => {
    setLocaleState(loc);
    setStoredLocale(loc);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = loc;
    }

    // URL routing synchronization for public pages
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const search = window.location.search;
      const hash = window.location.hash;

      // Shells and internal routes don't use the /hi URL prefix
      const isInternalShell = /^\/(app|admin|guard|vendor|login|activate)(\/|$)/.test(pathname);

      if (!isInternalShell) {
        if (loc === 'hi' && !pathname.startsWith('/hi')) {
          const newPath = pathname === '/' ? '/hi' : `/hi${pathname}`;
          window.location.href = `${newPath}${search}${hash}`;
          return;
        } else if (loc === 'en' && (pathname === '/hi' || pathname.startsWith('/hi/'))) {
          const stripped = pathname === '/hi' ? '/' : pathname.slice(3);
          window.location.href = `${stripped}${search}${hash}`;
          return;
        }
      }
    }

    try {
      await api.updatePreferences({ language: loc });
    } catch {
      // Offline / guest mode tolerance
    }
  };

  const currentDict = getFullDictionary(locale);

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize: handleSetFontSize,
        locale,
        setLocale: handleSetLocale,
        t: currentDict,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    // Return safe fallback if used outside provider (e.g. testing)
    return {
      fontSize: 'normal' as FontSizeSetting,
      setFontSize: async () => {},
      locale: 'en' as Locale,
      setLocale: async () => {},
      t: getFullDictionary('en'),
    };
  }
  return context;
}
