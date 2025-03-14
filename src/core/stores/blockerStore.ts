import { create } from 'zustand';

// Helper for domain matching
function isDomainBlocked(url: string, blockedPattern: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    // Match exact domain or subdomains, but not domains that just contain the pattern
    const pattern = new RegExp(`(^|\.)${escapeRegExp(blockedPattern)}$`);
    return pattern.test(hostname);
  } catch (e) {
    // If URL parsing fails, check if the string contains the pattern
    return url.includes(blockedPattern);
  }
}

// Escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface BlockerSettings {
  mode: 'pomodoro' | 'schedule';
  enabledDuringWork: boolean;
  scheduleEnabled: boolean;
  workSchedule: {
    days: number[];  // 0-6 for Sunday to Saturday
    timeRanges: Array<{
      start: string; // Format: "0800"
      end: string;   // Format: "1200"
    }>;
  };
  blockedSites: string[];
}

interface BlockerState extends BlockerSettings {
  isInitialized: boolean;
  
  // Actions
  init: () => Promise<void>;
  addBlockedSite: (site: string) => void;
  removeBlockedSite: (site: string) => void;
  toggleWorkBlocking: () => void;
  toggleScheduleBlocking: () => void;
  updateSchedule: (days: number[], timeRanges: Array<{ start: string; end: string }>) => void;
  updateSettings: (settings: Partial<BlockerSettings>) => void;
  isBlocked: (url: string) => boolean;
}

const defaultBlockedSites = [
  'facebook.com',
  'reddit.com',
  'xiaohongshu.com',
  'bilibili.com',
  'youtube.com',
  'douyin.com',
  'tiktok.com',
  'instagram.com',
  'x.com',  // New Twitter domain
  'weibo.com'
];

const defaultSettings: BlockerSettings = {
  mode: 'pomodoro',
  enabledDuringWork: true,
  scheduleEnabled: true,
  workSchedule: {
    days: [1, 2, 3, 4, 5],  // Monday to Friday
    timeRanges: [
      { start: "0800", end: "1200" },
      { start: "1330", end: "1730" }
    ]
  },
  blockedSites: defaultBlockedSites
};

const useBlockerStore = create<BlockerState>((set, get) => ({
  // Initialize with default settings
  ...defaultSettings,
  isInitialized: false,
  
  // Initialize from Chrome storage
  init: async () => {
    try {
      const data = await chrome.storage.sync.get('blockerSettings');
      if (data.blockerSettings) {
        // Merge with defaults to ensure all fields exist
        const settings = { ...defaultSettings, ...data.blockerSettings };
        set({ ...settings, isInitialized: true });
      } else {
        // First use, save defaults
        chrome.storage.sync.set({ blockerSettings: defaultSettings });
        set({ ...defaultSettings, isInitialized: true });
      }
    } catch (error) {
      console.error('Failed to initialize blocker settings:', error);
      set({ ...defaultSettings, isInitialized: true });
    }
  },
  
  // Actions
  addBlockedSite: (site: string) => {
    const { blockedSites } = get();
    // Normalize the URL (remove http/https prefix)
    const normalizedSite = site.replace(/^https?:\/\/(www\.)?/, '');
    
    // Only add if not already in the list
    if (!blockedSites.includes(normalizedSite)) {
      const newBlockedSites = [...blockedSites, normalizedSite];
      set({ blockedSites: newBlockedSites });
      
      // Save to Chrome storage
      const settingsToSave = {
        mode: get().mode,
        enabledDuringWork: get().enabledDuringWork,
        scheduleEnabled: get().scheduleEnabled,
        workSchedule: get().workSchedule,
        blockedSites: newBlockedSites
      };
      
      chrome.storage.sync.set({
        blockerSettings: settingsToSave
      });
    }
  },
  
  removeBlockedSite: (site: string) => {
    const { blockedSites } = get();
    const normalizedSite = site.replace(/^https?:\/\/(www\.)?/, '');
    
    const newBlockedSites = blockedSites.filter(s => s !== normalizedSite);
    set({ blockedSites: newBlockedSites });
    
    // Save to Chrome storage
    const settingsToSave = {
      mode: get().mode,
      enabledDuringWork: get().enabledDuringWork,
      scheduleEnabled: get().scheduleEnabled,
      workSchedule: get().workSchedule,
      blockedSites: newBlockedSites
    };
    
    chrome.storage.sync.set({
      blockerSettings: settingsToSave
    });
  },
  
  toggleWorkBlocking: () => {
    const { enabledDuringWork } = get();
    set({ enabledDuringWork: !enabledDuringWork });
    
    // Save to Chrome storage
    const settingsToSave = {
      mode: get().mode,
      enabledDuringWork: !enabledDuringWork,
      scheduleEnabled: get().scheduleEnabled,
      workSchedule: get().workSchedule,
      blockedSites: get().blockedSites
    };
    
    chrome.storage.sync.set({
      blockerSettings: settingsToSave
    });
  },
  
  toggleScheduleBlocking: () => {
    const { scheduleEnabled } = get();
    set({ scheduleEnabled: !scheduleEnabled });
    
    // Save to Chrome storage
    const settingsToSave = {
      mode: get().mode,
      enabledDuringWork: get().enabledDuringWork,
      scheduleEnabled: !scheduleEnabled,
      workSchedule: get().workSchedule,
      blockedSites: get().blockedSites
    };
    
    chrome.storage.sync.set({
      blockerSettings: settingsToSave
    });
  },
  
  updateSchedule: (days, timeRanges) => {
    const newSchedule = {
      days,
      timeRanges
    };
    
    set({ workSchedule: newSchedule });
    
    // Save to Chrome storage
    const settingsToSave = {
      mode: get().mode,
      enabledDuringWork: get().enabledDuringWork,
      scheduleEnabled: get().scheduleEnabled,
      workSchedule: newSchedule,
      blockedSites: get().blockedSites
    };
    
    chrome.storage.sync.set({
      blockerSettings: settingsToSave
    });
  },
  
  updateSettings: (settings: Partial<BlockerSettings>) => {
    set({ ...settings });
    
    // Save to Chrome storage
    const currentState = get();
    const settingsToSave = {
      mode: settings.mode !== undefined ? settings.mode : currentState.mode,
      enabledDuringWork: settings.enabledDuringWork !== undefined ? settings.enabledDuringWork : currentState.enabledDuringWork,
      scheduleEnabled: settings.scheduleEnabled !== undefined ? settings.scheduleEnabled : currentState.scheduleEnabled,
      workSchedule: settings.workSchedule || currentState.workSchedule,
      blockedSites: settings.blockedSites || currentState.blockedSites
    };
    
    chrome.storage.sync.set({
      blockerSettings: settingsToSave
    });
  },
  
  // Helper to check if a URL should be blocked
  isBlocked: (url: string) => {
    const { mode, enabledDuringWork, scheduleEnabled, workSchedule, blockedSites } = get();
    
    // First check if the site is in the blocked list
    const isBlockedSite = blockedSites.some(site => isDomainBlocked(url, site));
    if (!isBlockedSite) return false;
    
    // Then check if we should be blocking based on mode
    if (mode === 'pomodoro') {
      // For pomodoro mode, we need to check the timer state
      // This requires accessing the timer store or checking chrome.storage
      return enabledDuringWork; // This is just a placeholder, actual implementation needs timer state
    }
    
    if (mode === 'schedule' && scheduleEnabled) {
      // Check if current time is within scheduled block times
      const now = new Date();
      const currentDay = now.getDay(); // 0-6, starting with Sunday
      
      // First check if today is a scheduled day
      if (!workSchedule.days.includes(currentDay)) {
        return false;
      }
      
      // Then check if current time is within any of the scheduled ranges
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const formattedTime = currentTime.toString().padStart(4, '0');
      
      return workSchedule.timeRanges.some(range => {
        return formattedTime >= range.start && formattedTime <= range.end;
      });
    }
    
    return false;
  }
}));

// Initialize store when imported
if (typeof chrome !== 'undefined' && chrome.storage) {
  // We use setTimeout to ensure this runs after the store is properly set up
  setTimeout(() => {
    useBlockerStore.getState().init();
  }, 0);
}

export default useBlockerStore; 