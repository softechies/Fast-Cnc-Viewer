import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import translations, { Language, languages } from './translations';
import { useLocation, useRoute } from 'wouter';

const LANGUAGE_STORAGE_KEY = 'cadviewer_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number> | string) => string;
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

// Helper function to extract language from URL path
function getLanguageFromUrl(pathname: string): Language | null {
  // Check if the pathname starts with a language code
  const pathLangMatch = pathname.match(/^\/(en|pl|cs|de|fr)(\/|$)/);
  if (pathLangMatch) {
    const langCode = pathLangMatch[1] as Language;
    return langCode;
  }
  return null;
}

// Main provider component
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  
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
  
  // Function to get language from different sources in order of priority
  const getInitialLanguage = (): Language => {
    // 1. First check URL for language code
    const urlLanguage = getLanguageFromUrl(location);
    if (urlLanguage) return urlLanguage;
    
    // 2. Then check localStorage
    const storedLanguage = getStoredLanguage();
    if (storedLanguage) return storedLanguage;
    
    // 3. Default to English
    return 'en';
  };

  // Start with language from URL, stored preference, or English as default
  const [language, setLanguageState] = useState<Language>(getInitialLanguage());
  
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
  const t = (key: string, params?: Record<string, string | number> | string): string => {
    const currentTranslations = translations[language] || translations.en;
    
    // Get the nested value using helper function
    const value = getNestedValue(currentTranslations, key);
    
    // Handle case when second parameter is a fallback string
    if (typeof params === 'string') {
      if (value === undefined) {
        return params; // Return fallback string
      }
      return typeof value === 'string' ? value : key;
    }
    
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation key is not a string: ${key}`);
      return key;
    }
    
    return formatTranslation(value, params as Record<string, string | number>);
  };

  const [, setLocation] = useLocation();

  // Set language, save to localStorage and update URL if needed
  const setLanguage = (lang: Language) => {
    // Update state
    setLanguageState(lang);
    
    // Save to localStorage
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.error('Failed to save language preference:', e);
    }
    
    // Update URL to include language prefix
    const urlLang = getLanguageFromUrl(location);
    
    // Only update URL if language change or no language in URL
    if (urlLang !== lang) {
      // Get current path without language prefix if it exists
      let currentPath = location;
      if (urlLang) {
        // Remove current language prefix from path
        currentPath = currentPath.replace(new RegExp(`^\/${urlLang}(\/|$)`), '/');
        if (currentPath === '') currentPath = '/';
      }
      
      // For root path, just use the language
      if (currentPath === '/') {
        setLocation(`/${lang}`);
      } else {
        // For other paths, prefix with language
        // Remove leading slash to avoid double slashes
        const cleanPath = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
        setLocation(`/${lang}/${cleanPath}`);
      }
    }
  };

  // Update document language attribute
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);
  
  // Listen for URL changes and update language if needed
  useEffect(() => {
    const urlLang = getLanguageFromUrl(location);
    if (urlLang && urlLang !== language) {
      setLanguageState(urlLang);
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, urlLang);
      } catch (e) {
        console.error('Failed to save language preference:', e);
      }
    }
  }, [location]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isDetecting }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook to access language context
export const useLanguage = () => useContext(LanguageContext);