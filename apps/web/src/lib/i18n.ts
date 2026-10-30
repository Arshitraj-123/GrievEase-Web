import enLocale from '../i18n/locales/en.json';
import hiLocale from '../i18n/locales/hi.json';

export type Locale = 'en' | 'hi';

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
  // Check 'lang' cookie first, then 'NEXT_LOCALE'
  const langMatch = document.cookie.match(/(?:^|;\s*)lang=([^;]*)/);
  if (langMatch && (langMatch[1] === 'en' || langMatch[1] === 'hi')) {
    return langMatch[1] as Locale;
  }
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]*)/);
  if (match && (match[1] === 'en' || match[1] === 'hi')) {
    return match[1] as Locale;
  }
  // Check localStorage
  const local = localStorage.getItem('grievease_locale');
  if (local === 'en' || local === 'hi') {
    return local;
  }
  return 'en';
}

export function setStoredLocale(locale: Locale) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('grievease_locale', locale);
  // Persist in 'lang', 'NEXT_LOCALE', and 'grievease_locale' cookies for 1 year
  const oneYear = 365 * 24 * 60 * 60;
  document.cookie = `lang=${locale}; path=/; max-age=${oneYear}; SameSite=Lax`;
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${oneYear}; SameSite=Lax`;
  document.cookie = `grievease_locale=${locale}; path=/; max-age=${oneYear}; SameSite=Lax`;
  // Dispatch custom storage event for same-tab listeners
  window.dispatchEvent(new Event('grievease_locale_change'));
}
