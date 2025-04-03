import { en } from './en';
import { pl } from './pl';
import { cs } from './cs';
import { de } from './de';
import { fr } from './fr';

export type Language = 'en' | 'pl' | 'cs' | 'de' | 'fr';

export const LANGUAGE_STORAGE_KEY = 'cad_viewer_language';

// All available translations
export const translations = {
  en,
  pl,
  cs,
  de,
  fr
};

// Get user's browser language or 'en' as fallback
export function getInitialLanguage(): Language {
  const storedLanguage = getStoredLanguage();
  if (storedLanguage) return storedLanguage;
  
  const browserLang = getBrowserLanguage();
  if (browserLang) return browserLang;
  
  return 'en'; // Default fallback
}

// Try to get language from localStorage
function getStoredLanguage(): Language | null {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
    if (stored && isValidLanguage(stored)) {
      return stored;
    }
    return null;
  } catch (e) {
    console.error('Failed to access localStorage:', e);
    return null;
  }
}

// Detect browser language from navigator
function getBrowserLanguage(): Language | null {
  try {
    const browserLang = navigator.language.split('-')[0] as Language;
    if (isValidLanguage(browserLang)) {
      return browserLang;
    }
    return null;
  } catch (e) {
    console.error('Failed to detect browser language:', e);
    return null;
  }
}

// Check if language code is supported
function isValidLanguage(code: string): code is Language {
  return Object.keys(translations).includes(code);
}

// Get translation for a key
export function getTranslation(language: Language, key: string): string {
  const translation = translations[language]?.[key];
  
  // If translation not found in selected language, fall back to English
  if (!translation && language !== 'en') {
    return translations.en[key] || key;
  }
  
  return translation || key;
}

// Get all translations for a language
export function getLanguageTranslations(language: Language) {
  return translations[language] || translations.en;
}

// Get list of available languages with their native names
export const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'pl', label: 'Polski' },
  { value: 'cs', label: 'Čeština' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' }
];