import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, getLanguageTranslations, getInitialLanguage, LANGUAGE_STORAGE_KEY } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage());

  // Replace placeholders in translation strings
  const formatTranslation = (translation: string, params?: Record<string, string>): string => {
    if (!params) return translation;
    
    return Object.entries(params).reduce((result, [key, value]) => {
      return result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }, translation);
  };

  // Get translation for a key
  const t = (key: string, params?: Record<string, string>): string => {
    const translations = getLanguageTranslations(language);
    
    if (translations[key] === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    const translation = translations[key];
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