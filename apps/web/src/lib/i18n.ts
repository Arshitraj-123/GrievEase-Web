import enLocale from '../i18n/locales/en.json';
import hiLocale from '../i18n/locales/hi.json';
import mrLocale from '../i18n/locales/mr.json';

export type Locale = 'en' | 'hi' | 'mr';

export type TranslationStructure = typeof enLocale;
export type AuthTranslations = TranslationStructure['auth'];
export type NavTranslations = TranslationStructure['nav'];
export type AppHomeTranslations = TranslationStructure['appHome'];
export type GrievancesTranslations = TranslationStructure['grievances'];
export type NotificationsTranslations = TranslationStructure['notifications'];
export type SettingsTranslations = TranslationStructure['settings'];
export type PwaTranslations = TranslationStructure['pwa'];
export type OfflineTranslations = TranslationStructure['offline'];

export const dictionaries: Record<Locale, TranslationStructure> = {
  en: enLocale,
  hi: hiLocale,
  mr: mrLocale,
};

export function getDictionary(locale: Locale = 'en'): AuthTranslations {
  const dict = dictionaries[locale] || dictionaries.en;
  return dict.auth;
}

export function getFullDictionary(locale: Locale = 'en'): TranslationStructure {
  return dictionaries[locale] || dictionaries.en;
}

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  // Check cookie
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  if (match && (match[1] === 'en' || match[1] === 'hi' || match[1] === 'mr')) {
    return match[1] as Locale;
  }
  // Check localStorage
  const local = localStorage.getItem('grievease_locale');
  if (local === 'en' || local === 'hi' || local === 'mr') {
    return local;
  }
  return 'en';
}

export function setStoredLocale(locale: Locale) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('grievease_locale', locale);
  // Persist in cookie for 1 year
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}
