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
    // 1. Initialise locale from cookie / localStorage
    const savedLocale = getStoredLocale();
    setLocaleState(savedLocale);

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
          if (profile.language && ['en', 'hi', 'mr'].includes(profile.language)) {
            setLocaleState(profile.language);
            setStoredLocale(profile.language);
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
