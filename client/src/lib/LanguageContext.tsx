import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import translations, { Language } from './translations';
import { useQuery } from '@tanstack/react-query';

const LANGUAGE_STORAGE_KEY = 'cadviewer_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isDetecting: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string, params?: Record<string, string | number>) => key,
  isDetecting: false
});

// Helper function to get a nested value from an object using a dot-separated path
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((prev, curr) => {
    return prev && typeof prev === 'object' ? prev[curr] : undefined;
  }, obj);
}

// Main provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  // Function to get stored language from localStorage
  const getStoredLanguage = (): Language | null => {
    try {
      const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
      if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
        return savedLanguage;
      }
    } catch (e) {
      console.error('Failed to read language preference:', e);
    }
    return null;
  };

  // Start with the stored language or English as a default
  const [language, setLanguageState] = useState<Language>(getStoredLanguage() || 'en');
  
  // Ręczne wykrywanie języka zamiast useQuery
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  
  // Wykrywanie języka przy ładowaniu komponentu
  useEffect(() => {
    const fetchLanguagePreference = async () => {
      if (!getStoredLanguage()) {
        try {
          // Ustawienie flagi wykrywania języka
          setIsDetecting(true);
          
          const response = await fetch('/api/language-preference');
          const data = await response.json();
          
          if (data.detectedLanguage) {
            if (Object.keys(translations).includes(data.detectedLanguage)) {
              setLanguage(data.detectedLanguage as Language);
            }
          }
        } catch (error) {
          console.error('Error fetching language preference:', error);
        } finally {
          // Zakończenie wykrywania języka
          setIsDetecting(false);
        }
      }
    };
    
    fetchLanguagePreference();
  }, []);

  // Format translation string with parameters
  const formatTranslation = (translation: string, params?: Record<string, string | number>): string => {
    if (!params) return translation;
    
    return Object.entries(params).reduce((result, [key, value]) => {
      return result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }, translation);
  };

  // Get translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
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
    <LanguageContext.Provider value={{ language, setLanguage, t, isDetecting }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to access language context
export const useLanguage = () => useContext(LanguageContext);