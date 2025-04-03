import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import translations, { Language } from './translations';

const LANGUAGE_STORAGE_KEY = 'cadviewer_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper function to get a nested value from an object using a dot-separated path
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((prev, curr) => {
    return prev && typeof prev === 'object' ? prev[curr] : undefined;
  }, obj);
}

// Main provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Get initial language from localStorage or browser settings
  const getInitialLanguage = (): Language => {
    try {
      const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
      if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
        return savedLanguage;
      }
    } catch (e) {
      console.error('Failed to read language preference:', e);
    }
    
    const browserLang = navigator.language.split('-')[0];
    if (browserLang && Object.keys(translations).includes(browserLang as Language)) {
      return browserLang as Language;
    }
    
    return 'en';
  };

  const [language, setLanguageState] = useState<Language>(getInitialLanguage());

  // Format translation string with parameters
  const formatTranslation = (translation: string, params?: Record<string, string>): string => {
    if (!params) return translation;
    
    return Object.entries(params).reduce((result, [key, value]) => {
      return result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }, translation);
  };

  // Get translation function
  const t = (key: string, params?: Record<string, string>): string => {
    const currentTranslations = translations[language] || translations.en;
    
    // Get the nested value using helper function
    const value = getNestedValue(currentTranslations, key);
    
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation key is not a string: ${key}`);
      return key;
    }
    
    return formatTranslation(value, params);
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

  // Update document language attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to access language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}