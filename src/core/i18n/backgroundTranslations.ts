// Import all translation files
import en from './translations/en.json';
import zh from './translations/zh.json';

// Define supported language types
type SupportedLanguage = 'en' | 'zh';

// Translations record
const translations: Record<SupportedLanguage, typeof en> = {
  en,
  zh
};

/**
 * Get a value from a nested object using a dot-separated path
 */
function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) as string;
}

/**
 * Get translation for background script
 * 
 * @param key The translation key (dot notation)
 * @param language The language code ('en' or 'zh')
 * @param params Optional parameters for interpolation
 */
export async function getTranslation(key: string, language?: string): Promise<string> {
  // Default to English if language not specified
  let currentLanguage = (language || 'en') as SupportedLanguage;
  
  // Try to get the language from storage if not provided
  if (!language) {
    try {
      const result = await chrome.storage.sync.get(['language']);
      if (result.language && (result.language === 'en' || result.language === 'zh')) {
        currentLanguage = result.language as SupportedLanguage;
      }
    } catch (error) {
      console.warn('Failed to get language from storage:', error);
    }
  }
  
  // Get the translation
  const translation = getNestedValue(translations[currentLanguage], key) || 
                     getNestedValue(translations.en, key) || 
                     key;
  
  return translation;
}

/**
 * Sync version of getTranslation that doesn't attempt to read from storage
 * (For when we already know the language or need a synchronous function)
 */
export function getTranslationSync(key: string, language: SupportedLanguage = 'en'): string {
  // Get the translation
  return getNestedValue(translations[language], key) || 
         getNestedValue(translations.en, key) || 
         key;
} 