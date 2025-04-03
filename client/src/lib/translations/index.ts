import enTranslations from './en';
import plTranslations from './pl';
import csTranslations from './cs';
import deTranslations from './de';
import frTranslations from './fr';

export type Language = 'en' | 'pl' | 'cs' | 'de' | 'fr';

export const languages: Language[] = ['en', 'pl', 'cs', 'de', 'fr'];

export const languageNames: Record<Language, string> = {
  en: 'English',
  pl: 'Polski',
  cs: 'Čeština',
  de: 'Deutsch',
  fr: 'Français'
};

export const translations: Record<Language, typeof enTranslations> = {
  en: enTranslations,
  pl: plTranslations,
  cs: csTranslations,
  de: deTranslations,
  fr: frTranslations
};

export default translations;