import { create } from 'zustand';

export type Language = 'en' | 'zh';

interface LanguageState {
  // Settings
  language: Language;
  
  // Actions
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

const useLanguageStore = create<LanguageState>((set, get) => ({
  // Settings
  language: 'en',
  
  // Actions
  setLanguage: (language: Language) => {
    set({ language });
    
    // Save to Chrome storage
    chrome.storage.sync.set({
      languageSettings: {
        ...get(),
        language
      }
    });
  },
  
  toggleLanguage: () => {
    const { language } = get();
    const newLanguage: Language = language === 'en' ? 'zh' : 'en';
    get().setLanguage(newLanguage);
  }
}));

// Initialize from Chrome storage
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.sync.get(['languageSettings'], (result) => {
    if (result.languageSettings) {
      useLanguageStore.setState(result.languageSettings);
    } else {
      // Default to browser language if available
      const browserLanguage = navigator.language.split('-')[0];
      if (browserLanguage === 'zh') {
        useLanguageStore.getState().setLanguage('zh');
      }
    }
  });
}

export default useLanguageStore; 