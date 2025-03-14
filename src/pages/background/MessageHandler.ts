import { TimerManager } from './TimerManager';
import * as soundController from './soundController';

export class MessageHandler {
  private timerManager: TimerManager;
  private lastSaveTime: number = 0;
  private readonly SAVE_INTERVAL: number = 5000; // 每5秒保存一次状态
  
  constructor(timerManager: TimerManager) {
    this.timerManager = timerManager;
  }
  
  // 初始化消息处理程序
  initialize(): void {
    // 设置消息监听器
    chrome.runtime.onMessage.addListener(this.handleMessages.bind(this));
    
    // 向计时器管理器注册状态变更回调
    this.timerManager.setStateChangeCallback(this.handleTimerStateChange.bind(this));
  }
  
  // 处理计时器状态变更
  private handleTimerStateChange(state: any): void {
    // 广播状态
    this.broadcastState();
  }
  
  // 保存状态到存储
  private saveTimerState(): void {
    const now = Date.now();
    
    // 限制保存频率
    if (now - this.lastSaveTime < this.SAVE_INTERVAL) {
      return;
    }
    
    this.lastSaveTime = now;
    
    // 获取当前状态
    const timerState = this.timerManager.getState();
    
    // 保存到本地存储（不同步到其他设备）
    chrome.storage.local.set({ timerState });
    
    // 保存设置到同步存储（同步到其他设备）
    chrome.storage.sync.set({
      timerSettings: timerState.settings,
      soundSettings: timerState.soundSettings
    });
    
    console.log('已保存计时器状态');
  }
  
  // 广播状态到所有活动页面
  private broadcastState(): void {
    const message = {
      type: 'STATE_UPDATE',
      state: this.timerManager.getState()
    };
    
    // 尝试发送消息，忽略"接收方不存在"错误
    this.sendMessageSafely(message);
    
    // 保存状态
    this.saveTimerState();
  }
  
  // 安全发送消息，忽略接收方不存在的错误
  private sendMessageSafely(message: any): void {
    // 使用Promise处理异步错误
    chrome.runtime.sendMessage(message).catch(error => {
      // 只有当错误不是"接收方不存在"时才输出
      if (error && error.message && !error.message.includes('Receiving end does not exist')) {
        console.error('Error sending message:', error);
      }
    });
    
    // 也发送到所有内容脚本
    try {
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, message).catch(() => {
              // 忽略内容脚本不存在的错误
            });
          }
        });
      });
    } catch (error) {
      // 忽略错误
    }
  }
  
  // 处理收到的消息
  private handleMessages(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): boolean {
    console.log('Background received message:', message);
    
    // 处理来自offscreen文档的关闭请求
    if (message.action === 'closeOffscreen' && message.target === 'background') {
      this.handleOffscreenClose();
      return true;
    }
    
    switch (message.type) {
      case 'GET_STATE':
        // 获取状态前先停止任何可能的声音播放
        soundController.stopAllSounds();
        
        // 获取最新状态并确保徽章与状态同步
        const currentState = this.timerManager.getState();
        
        // 立即发送响应
        sendResponse(currentState);
        
        // 广播一次状态，确保所有组件与后台状态同步
        this.broadcastState();
        break;
      
      case 'START':
        this.timerManager.startTimer();
        sendResponse({ success: true });
        break;
      
      case 'PAUSE':
        this.timerManager.pauseTimer();
        sendResponse({ success: true });
        break;
      
      case 'RESET':
        this.timerManager.resetTimer();
        sendResponse({ success: true });
        break;
      
      case 'SKIP':
        this.timerManager.skipPhase();
        sendResponse({ success: true });
        break;
      
      case 'UPDATE_SETTINGS':
        this.timerManager.updateSettings(message.settings);
        sendResponse({ success: true });
        break;
      
      case 'UPDATE_SOUND_SETTINGS':
        this.timerManager.updateSoundSettings(message.settings);
        sendResponse({ success: true });
        break;
        
      case 'UPDATE_UI_SETTINGS':
        this.handleUISettingsUpdate(message.settings);
        sendResponse({ success: true });
        break;
    }
    
    return true; // 保持消息通道开放，以便异步响应
  }
  
  // 处理UI设置更新
  private handleUISettingsUpdate(settings: any): void {
    console.log('接收到UI设置更新:', settings);
    
    // 更新音量设置
    if (settings.soundVolume !== undefined) {
      soundController.updateVolumeSettings(settings.soundVolume);
    }
  }
  
  // 处理离屏文档关闭
  private async handleOffscreenClose(): Promise<void> {
    try {
      // 检查是否真的存在offscreen文档
      const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType]
      });
      
      console.log('关闭offscreen文档前检查状态:', {
        hasOffscreenDocument: existingContexts && existingContexts.length > 0,
        existingContexts: existingContexts
      });
      
      if (existingContexts && existingContexts.length > 0) {
        await chrome.offscreen.closeDocument();
        console.log('成功关闭offscreen文档');
      } else {
        console.log('无法关闭offscreen文档：文档不存在');
      }
    } catch (error) {
      console.error('关闭offscreen文档时出错:', error);
    }
  }
} 