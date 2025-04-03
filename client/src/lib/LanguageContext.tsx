import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import translations, { Language } from './translations';

const LANGUAGE_STORAGE_KEY = 'cadviewer_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Funkcja do wykrywania domyślnego języka użytkownika
  const getInitialLanguage = (): Language => {
    // Try to get language from localStorage
    try {
      const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
      if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
        return savedLanguage;
      }
    } catch (e) {
      console.error('Failed to read language preference:', e);
    }
    
    // Fallback to browser language or navigator.languages
    const browserLang = navigator.language.split('-')[0];
    if (browserLang && Object.keys(translations).includes(browserLang as Language)) {
      return browserLang as Language;
    }
    
    // Default to English
    return 'en';
  };

  const [language, setLanguageState] = useState<Language>(getInitialLanguage());

  // Replace placeholders in translation strings
  const formatTranslation = (translation: string, params?: Record<string, string>): string => {
    if (!params) return translation;
    
    return Object.entries(params).reduce((result, [key, value]) => {
      return result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }, translation);
  };

  // Funkcja zwracająca tłumaczenia dla danego języka
  const getLanguageTranslations = (lang: Language) => {
    return translations[lang] || translations.en;
  };

  // Get translation for a key
  const t = (key: string, params?: Record<string, string>): string => {
    const translationObject = getLanguageTranslations(language);
    
    if (translationObject[key] === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    const translation = translationObject[key];
    if (typeof translation !== 'string') {
      console.warn(`Translation key is not a string: ${key}`);
      return key;
    }
    
    return formatTranslation(translation, params);
  };

  // Set language and save to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.error('Failed to save language preference:', e);
    }
  };

  // Update document language attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use language context in components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}