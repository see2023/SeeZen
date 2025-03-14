import { create } from 'zustand';
import { SoundEffect } from '../utils/SoundManager';

export type TimerMode = 'work' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused';

interface TimerSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

interface SoundSettings {
  workCompleteSound: SoundEffect;
  breakCompleteSound: SoundEffect;
}

interface TimerState {
  // 运行状态
  status: TimerStatus;
  currentMode: TimerMode;
  timeRemaining: number;
  completedPomodoros: number;
  
  // 设置
  settings: TimerSettings;
  soundSettings: SoundSettings;
  
  // 辅助计算属性
  displayTime: string;
  
  // Actions
  initialize: () => Promise<void>;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  updateSettings: (settings: Partial<TimerSettings>) => void;
  updateSoundSettings: (settings: Partial<SoundSettings>) => void;
}

// 格式化时间显示
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

const useTimerStore = create<TimerState>()((set, get) => ({
  // 初始状态
  status: 'idle',
  currentMode: 'work',
  timeRemaining: 25 * 60,
  completedPomodoros: 0,
  displayTime: '25:00',
  
  settings: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: true,
    autoStartPomodoros: false,
  },
  
  soundSettings: {
    workCompleteSound: 'bell_ding',
    breakCompleteSound: 'timer',
  },
  
  // 初始化 - 从background获取状态
  initialize: async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    set({
      status: response.status,
      currentMode: response.currentMode,
      timeRemaining: response.timeRemaining,
      completedPomodoros: response.completedPomodoros,
      settings: response.settings,
      soundSettings: response.soundSettings,
      displayTime: formatTime(response.timeRemaining)
    });
    
    // 设置状态更新监听器
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'STATE_UPDATE') {
        // 检查当前是否在设置页面
        const isOptionsPage = window.location.href.includes('options/index.html');
        
        if (isOptionsPage) {
          // 在设置页面中，不更新任何状态，保持当前状态不变
          return;
        }
        
        // 在其他页面中，更新所有状态
        set({
          status: message.state.status,
          currentMode: message.state.currentMode,
          timeRemaining: message.state.timeRemaining,
          completedPomodoros: message.state.completedPomodoros,
          settings: message.state.settings,
          soundSettings: message.state.soundSettings,
          displayTime: formatTime(message.state.timeRemaining)
        });
      }
    });
  },
  
  // Actions
  start: () => {
    chrome.runtime.sendMessage({ type: 'START' });
  },
  
  pause: () => {
    chrome.runtime.sendMessage({ type: 'PAUSE' });
  },
  
  reset: () => {
    chrome.runtime.sendMessage({ type: 'RESET' });
  },
  
  skip: () => {
    chrome.runtime.sendMessage({ type: 'SKIP' });
  },
  
  updateSettings: (newSettings) => {
    chrome.runtime.sendMessage({
      type: 'UPDATE_SETTINGS',
      settings: newSettings
    });
  },
  
  updateSoundSettings: (newSettings) => {
    chrome.runtime.sendMessage({
      type: 'UPDATE_SOUND_SETTINGS',
      settings: newSettings
    });
  }
}));

export default useTimerStore;