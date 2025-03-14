// Background service worker for SeeZen extension
import { StatsManager } from './StatsManager';
import { TimerManager } from './TimerManager';
import { MessageHandler } from './MessageHandler';
import { setupWebNavigationBlocker } from './siteBlocker';

// 初始化后台服务
async function initializeBackgroundService() {
  console.log('SeeZen background service initializing...');
  
  try {
    // 创建统计管理器
    const statsManager = new StatsManager();
    
    // 创建计时器管理器
    const timerManager = new TimerManager(statsManager);
    
    // 创建消息处理器
    const messageHandler = new MessageHandler(timerManager);
    messageHandler.initialize();
    
    // 设置闹钟监听器
    chrome.alarms.onAlarm.addListener(alarm => {
      if (alarm.name === 'timerTick') {
        timerManager.handleAlarm();
      }
    });
    
    // 从存储加载状态
    await loadSavedState(timerManager);
    
    // 设置网站阻止器
    setupWebNavigationBlocker();
    
    console.log('SeeZen background service initialized successfully');
  } catch (error) {
    console.error('Error initializing background service:', error);
  }
}

// 从存储加载保存的状态
async function loadSavedState(timerManager: TimerManager) {
  try {
    // 从本地存储加载计时器状态
    const localResult = await chrome.storage.local.get(['timerState']);
    if (localResult.timerState) {
      await timerManager.restoreFromSavedState(localResult.timerState);
    }
    
    // 从同步存储加载设置
    const syncResult = await chrome.storage.sync.get(['timerSettings', 'soundSettings', 'blockerSettings']);
    const settings = syncResult.timerSettings ? syncResult.timerSettings : {};
    const soundSettings = syncResult.soundSettings ? syncResult.soundSettings : {};
    
    // 应用设置
    if (Object.keys(settings).length > 0) {
      timerManager.updateSettings(settings);
    }
    
    // 应用音效设置
    if (Object.keys(soundSettings).length > 0) {
      timerManager.updateSoundSettings(soundSettings);
    }
    
    console.log('已加载保存的状态和设置');
  } catch (error) {
    console.error('加载保存的状态时出错:', error);
  }
}

// 启动后台服务
initializeBackgroundService(); 