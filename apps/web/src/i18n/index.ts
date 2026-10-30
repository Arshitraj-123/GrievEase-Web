'use client';

import { useState, useEffect } from 'react';
import { getFullDictionary, getStoredLocale, setStoredLocale, Locale, TranslationStructure } from '@/lib/i18n';

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(getStoredLocale());

    const handleStorageChange = () => {
      setLocaleState(getStoredLocale());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('grievease_locale_change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('grievease_locale_change', handleStorageChange);
    };
  }, []);

  const changeLocale = (newLocale: Locale) => {
    setStoredLocale(newLocale);
    setLocaleState(newLocale);
  };

  const dict = getFullDictionary(locale);

  const t = (key: string): string => {
    const parts = key.split('.');
    let curr: any = dict;
    for (const part of parts) {
      if (!curr || typeof curr !== 'object') return key;
      curr = curr[part];
    }
    return typeof curr === 'string' ? curr : key;
  };

  return { t, locale, changeLocale };
}

export * from '@/lib/i18n';
