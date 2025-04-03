import en from './en';
import pl from './pl';
import cs from './cs';
import de from './de';
import fr from './fr';

export type Language = 'en' | 'pl' | 'cs' | 'de' | 'fr';

export interface TranslationDictionary {
  [key: string]: string;
}

export interface LanguageOption {
  value: Language;
  label: string;
}

export const languageOptions: LanguageOption[] = [
  { value: 'en', label: 'English' },
  { value: 'pl', label: 'Polski' },
  { value: 'cs', label: 'Čeština' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' }
];

const translations: Record<Language, TranslationDictionary> = {
  en,
  pl,
  cs,
  de,
  fr
};

export default translations;