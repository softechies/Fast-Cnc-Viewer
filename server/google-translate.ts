/**
 * Google Translate service for automatic translation of model descriptions
 */

// Mapping języków obsługiwanych przez aplikację do kodów Google Translate
const LANGUAGE_CODES = {
  en: 'en',
  pl: 'pl',
  cs: 'cs',
  de: 'de',
  fr: 'fr',
  es: 'es',
} as const;

export type SupportedLanguage = keyof typeof LANGUAGE_CODES;

interface TranslationResult {
  translatedText: string;
  detectedSourceLanguage?: string;
}

interface MultilingualDescriptions {
  descriptionEn?: string;
  descriptionPl?: string;
  descriptionCs?: string;
  descriptionDe?: string;
  descriptionFr?: string;
  descriptionEs?: string;
}

/**
 * Translates text using Google Translate API
 */
async function translateText(text: string, targetLanguage: string, sourceLanguage?: string): Promise<TranslationResult> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Translate API key not configured');
  }

  const url = 'https://translation.googleapis.com/language/translate/v2';
  
  const params = new URLSearchParams({
    key: apiKey,
    q: text,
    target: targetLanguage,
    format: 'text',
  });

  if (sourceLanguage) {
    params.append('source', sourceLanguage);
  }

  try {
    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Translate API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data.translations || data.data.translations.length === 0) {
      throw new Error('Invalid response from Google Translate API');
    }

    const translation = data.data.translations[0];
    
    return {
      translatedText: translation.translatedText,
      detectedSourceLanguage: translation.detectedSourceLanguage,
    };
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}

/**
 * Translates description to all supported languages
 */
export async function translateDescription(
  originalText: string, 
  originalLanguage: SupportedLanguage
): Promise<MultilingualDescriptions> {
  const sourceLanguageCode = LANGUAGE_CODES[originalLanguage];
  const results: MultilingualDescriptions = {};
  
  // Set original description in its language
  const originalKey = `description${originalLanguage.charAt(0).toUpperCase() + originalLanguage.slice(1)}` as keyof MultilingualDescriptions;
  results[originalKey] = originalText;

  // Translate to all other languages
  for (const [langKey, langCode] of Object.entries(LANGUAGE_CODES)) {
    if (langKey === originalLanguage) {
      continue; // Skip original language
    }

    try {
      const translation = await translateText(originalText, langCode, sourceLanguageCode);
      const descriptionKey = `description${langKey.charAt(0).toUpperCase() + langKey.slice(1)}` as keyof MultilingualDescriptions;
      results[descriptionKey] = translation.translatedText;
      
      console.log(`Translated to ${langKey}: "${translation.translatedText}"`);
    } catch (error) {
      console.error(`Failed to translate to ${langKey}:`, error);
      // Continue with other translations even if one fails
    }
  }

  return results;
}

/**
 * Detects the language of the given text
 */
export async function detectLanguage(text: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  
  if (!apiKey) {
    console.warn('Google Translate API key not configured');
    return null;
  }

  const url = 'https://translation.googleapis.com/language/translate/v2/detect';
  
  const params = new URLSearchParams({
    key: apiKey,
    q: text,
  });

  try {
    const response = await fetch(`${url}?${params}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`Language detection error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data && data.data.detections && data.data.detections[0] && data.data.detections[0][0]) {
      return data.data.detections[0][0].language;
    }
    
    return null;
  } catch (error) {
    console.error('Language detection error:', error);
    return null;
  }
}

/**
 * Maps Google Translate language code to our supported languages
 */
export function mapToSupportedLanguage(detectedLanguage: string): SupportedLanguage {
  // Try exact match first
  for (const [ourLang, googleLang] of Object.entries(LANGUAGE_CODES)) {
    if (googleLang === detectedLanguage) {
      return ourLang as SupportedLanguage;
    }
  }
  
  // Default to English if no match
  return 'en';
}