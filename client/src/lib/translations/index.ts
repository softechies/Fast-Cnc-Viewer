import enTranslations from './en';
import plTranslations from './pl';
import csTranslations from './cs';
import deTranslations from './de';
import frTranslations from './fr';
import esTranslations from './es';

export type Language = 'en' | 'pl' | 'cs' | 'de' | 'fr' | 'es';

export const languages: Language[] = ['en', 'pl', 'cs', 'de', 'fr', 'es'];

export const languageNames: Record<Language, string> = {
  en: 'English',
  pl: 'Polski',
  cs: 'Čeština',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español'
};

type TranslationType = typeof import('./en').default

export const translations: Record<Language, TranslationType> = {
  en: enTranslations,
  pl: plTranslations as unknown as TranslationType,
  cs: csTranslations as unknown as TranslationType,
  de: deTranslations as unknown as TranslationType,
  fr: frTranslations as unknown as TranslationType,
  es: esTranslations as unknown as TranslationType
};

export default translations;