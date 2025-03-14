import { SoundEffect } from '../../core/utils/SoundManager';

// Tab type definition
export type TabType = 'timer' | 'blocker' | 'appearance';

// Settings interface that contains all settings
export interface Settings {
  // Timer settings
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;

  // Sound settings
  workCompleteSound: SoundEffect;
  breakCompleteSound: SoundEffect;
  soundVolume: number;

  // Blocker settings
  enabledDuringWork: boolean;
  enabledDuringBreaks: boolean;
  blockedSites: string;
  whitelist: string;

  // Appearance settings
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'zh';
}

// Props for tab components
export interface TabProps {
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  previewSound?: (sound: SoundEffect) => void;
} 