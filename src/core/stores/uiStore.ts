import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface UIState {
  // Settings
  theme: Theme;
  show3D: boolean;
  soundVolume: number;
  activeTab: string;
  
  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggle3D: () => void;
  setVolume: (volume: number) => void;
  setActiveTab: (tab: string) => void;
  updateSettings: (settings: Partial<UISettings>) => void;
}

interface UISettings {
  theme: Theme;
  show3D: boolean;
  soundVolume: number;
}

const useUIStore = create<UIState>((set, get) => ({
  // Settings
  theme: 'light',
  show3D: true,
  soundVolume: 0.7,
  activeTab: 'timer',
  
  // Actions
  setTheme: (theme: Theme) => {
    set({ theme });
    
    // Save to Chrome storage
    chrome.storage.sync.set({
      uiSettings: {
        ...get(),
        theme
      }
    });
    
    // Apply theme to document
    if (typeof document !== 'undefined') {
      // First remove any existing theme classes
      document.body.classList.remove('theme-light', 'theme-dark');
      
      if (theme === 'system') {
        // Use system preference
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
      } else {
        // Use specific theme
        document.body.classList.add(`theme-${theme}`);
      }
    }
  },
  
  toggleTheme: () => {
    const { theme } = get();
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    get().setTheme(newTheme);
  },
  
  toggle3D: () => {
    const { show3D } = get();
    set({ show3D: !show3D });
    
    // Save to Chrome storage
    chrome.storage.sync.set({
      uiSettings: {
        ...get(),
        show3D: !show3D
      }
    });
  },
  
  setVolume: (volume: number) => {
    set({ soundVolume: volume });
    
    // Save to Chrome storage
    chrome.storage.sync.set({
      uiSettings: {
        ...get(),
        soundVolume: volume
      }
    });
  },
  
  setActiveTab: (tab: string) => {
    set({ activeTab: tab });
  },
  
  updateSettings: (settings: Partial<UISettings>) => {
    set({ ...settings });
    
    // Save to Chrome storage
    chrome.storage.sync.set({
      uiSettings: {
        ...get(),
        ...settings
      }
    });
    
    // Apply theme if it was updated
    if (settings.theme && typeof document !== 'undefined') {
      get().setTheme(settings.theme);
    }
  }
}));

// Set up system theme change listener
if (typeof window !== 'undefined') {
  const systemThemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  systemThemeMedia.addEventListener('change', (e) => {
    const { theme } = useUIStore.getState();
    if (theme === 'system') {
      // Update theme if using system preference
      document.body.classList.remove('theme-light', 'theme-dark');
      document.body.classList.add(e.matches ? 'theme-dark' : 'theme-light');
    }
  });
}

// Initialize from Chrome storage
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.sync.get(['uiSettings'], (result) => {
    if (result.uiSettings) {
      useUIStore.setState(result.uiSettings);
      
      // Apply theme
      if (result.uiSettings.theme) {
        useUIStore.getState().setTheme(result.uiSettings.theme);
      }
    }
  });
}

export default useUIStore; 