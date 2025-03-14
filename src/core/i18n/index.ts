import { useEffect, useState } from 'react';
import useLanguageStore from '../stores/languageStore';

// Import all translation files
import en from './translations/en.json';
import zh from './translations/zh.json';

// Define translations type
type NestedKeyOf<T> = {
  [K in keyof T & (string | number)]: T[K] extends object 
    ? `${K}.${NestedKeyOf<T[K]>}` 
    : K
}[keyof T & (string | number)];

// Type for nested path strings
type TranslationPath = NestedKeyOf<typeof en>;

// Translations record
const translations = {
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
 * Custom hook for translations
 */
export function useTranslation() {
  const { language } = useLanguageStore();
  const [currentTranslations, setCurrentTranslations] = useState(translations[language]);
  
  useEffect(() => {
    setCurrentTranslations(translations[language]);
  }, [language]);
  
  /**
   * Translate function
   * @param key The translation key (dot notation)
   * @param params Optional parameters for interpolation
   */
  const t = (key: TranslationPath, params?: Record<string, string | number>): string => {
    // Get the translation
    let text = getNestedValue(currentTranslations, key) || getNestedValue(translations.en, key) || key;
    
    // Replace parameters if provided
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        text = text.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
    }
    
    return text;
  };
  
  return { t, language };
}

export default useTranslation; 