import { updateBadge, formatTime } from '../../core/utils/badgeManager';
import { SoundEffect } from '../../core/utils/SoundManager';
import { getTranslationSync } from '../../core/i18n/backgroundTranslations';
import * as soundController from './soundController';
import { DailyStats, StatsManager } from './StatsManager';

// 计时器状态类型定义
export type TimerMode = 'work' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerState {
  currentMode: TimerMode;
  status: TimerStatus;
  timeRemaining: number;
  completedPomodoros: number;
  displayTime: string;
  settings: {
    workDuration: number;             // 工作时长（分钟）
    shortBreakDuration: number;       // 短休息时长（分钟）
    longBreakDuration: number;        // 长休息时长（分钟）
    longBreakInterval: number;        // 长休息间隔（工作周期数）
    autoStartBreaks: boolean;         // 工作结束后自动开始休息
    autoStartPomodoros: boolean;      // 休息结束后自动开始工作
  };
  soundSettings: {
    workCompleteSound: SoundEffect;   // 工作完成音效
    breakCompleteSound: SoundEffect;  // 休息完成音效
  };
  dailyStats: {
    date: string;                    // 日期，格式 YYYY-MM-DD
    workSeconds: number;             // 工作秒数
    pomodorosCompleted: number;      // 完成的番茄数
  };
}

export class TimerManager {
  private timerState: TimerState;
  private statsManager: StatsManager;
  private stateChangeCallback: ((state: TimerState) => void) | null = null;
  
  constructor(statsManager: StatsManager) {
    this.statsManager = statsManager;
    
    // 初始化计时器状态
    this.timerState = {
      currentMode: 'work',
      status: 'idle',
      timeRemaining: 25 * 60, // 默认25分钟（秒）
      completedPomodoros: 0,
      displayTime: '25:00',
      settings: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        longBreakInterval: 4,
        autoStartBreaks: true,
        autoStartPomodoros: false
      },
      soundSettings: {
        workCompleteSound: 'bell_ding',
        breakCompleteSound: 'timer',
      },
      dailyStats: statsManager.getStats()
    };
  }
  
  // 获取当前状态
  getState(): TimerState {
    // 获取状态时确保徽章显示最新状态
    this.updateBadgeDisplay();
    return { ...this.timerState };
  }
  
  // 从保存的状态恢复
  async restoreFromSavedState(savedState: Partial<TimerState>): Promise<void> {
    if (savedState) {
      // 应用保存的状态，但使用新初始化的统计
      this.timerState = {
        ...this.timerState,
        ...savedState,
        dailyStats: this.statsManager.getStats()
      };
      
      // 如果状态是运行中，重新开始计时
      if (this.timerState.status === 'running') {
        this.startTimerAlarm();
      }
      
      // 更新徽章
      this.updateBadgeDisplay();
    }
  }
  
  // 设置状态变更回调
  setStateChangeCallback(callback: (state: TimerState) => void): void {
    this.stateChangeCallback = callback;
  }
  
  // 更新设置
  updateSettings(newSettings: Partial<TimerState['settings']>): void {
    // 更新设置
    this.timerState.settings = {
      ...this.timerState.settings,
      ...newSettings
    };
    
    // 如果计时器处于闲置状态，则根据新设置重置时间
    if (this.timerState.status === 'idle') {
      this.resetTimer();
    }
    
    // 通知状态变更
    this.notifyStateChange();
  }
  
  // 更新音效设置
  updateSoundSettings(newSoundSettings: Partial<TimerState['soundSettings']>): void {
    // 更新设置
    this.timerState.soundSettings = {
      ...this.timerState.soundSettings,
      ...newSoundSettings
    };
    
    // 通知状态变更
    this.notifyStateChange();
  }
  
  // 开始计时
  startTimer(): void {
    if (this.timerState.status === 'running') {
      console.log('计时器已经在运行中，忽略开始请求');
      return;
    }
    
    // 判断是否是从暂停恢复还是首次开始
    const isResumingFromPause = this.timerState.status === 'paused';
    
    console.log('开始计时:', {
      mode: this.timerState.currentMode,
      isResumingFromPause: isResumingFromPause,
      autoStartEnabled: this.timerState.settings.autoStartPomodoros,
      currentTime: new Date().toISOString()
    });
    
    // 停止所有声音，确保不会有声音继续播放
    console.log('开始前停止所有声音');
    soundController.stopAllSounds();
    
    // 设置状态为运行中
    this.timerState.status = 'running';
    
    // 只有在首次开始工作且不是自动开始时才播放休息完成音效
    if (
      !isResumingFromPause && 
      this.timerState.currentMode === 'work' && 
      !this.timerState.settings.autoStartPomodoros
    ) {
      const breakCompleteSound = this.timerState.soundSettings.breakCompleteSound;
      if (breakCompleteSound !== 'none') {
        console.log('播放休息完成音效:', breakCompleteSound);
        soundController.playSound(breakCompleteSound);
      }
    }
    
    // 启动定时器闹钟
    this.startTimerAlarm();
    
    // 更新徽章
    this.updateBadgeDisplay();
    
    // 通知状态变更
    this.notifyStateChange();
  }
  
  // 暂停计时
  pauseTimer(): void {
    if (this.timerState.status !== 'running') return;
    
    console.log('暂停计时:', {
      mode: this.timerState.currentMode,
      timeRemaining: this.timerState.timeRemaining
    });
    
    // 设置状态为暂停
    this.timerState.status = 'paused';
    
    // 停止定时器
    this.stopTimerAlarm();
    
    // 停止所有声音，确保不会有声音继续播放
    soundController.stopAllSounds();
    
    // 更新徽章
    this.updateBadgeDisplay();
    
    // 通知状态变更
    this.notifyStateChange();
  }
  
  // 重置计时器
  resetTimer(): void {
    console.log('重置计时器');
    
    // 停止任何运行中的计时器
    this.stopTimerAlarm();
    
    // 停止所有声音
    soundController.stopAllSounds();
    
    // 重置状态
    this.timerState.status = 'idle';
    
    // 根据当前模式设置时间
    switch (this.timerState.currentMode) {
      case 'work':
        this.timerState.timeRemaining = this.timerState.settings.workDuration * 60;
        break;
      case 'shortBreak':
        this.timerState.timeRemaining = this.timerState.settings.shortBreakDuration * 60;
        break;
      case 'longBreak':
        this.timerState.timeRemaining = this.timerState.settings.longBreakDuration * 60;
        break;
    }
    
    // 更新显示时间
    this.timerState.displayTime = formatTime(this.timerState.timeRemaining);
    
    // 更新徽章
    this.updateBadgeDisplay();
    
    // 通知状态变更
    this.notifyStateChange();
  }
  
  // 跳过当前阶段
  skipPhase(): void {
    // 计算下一个模式
    let nextMode: TimerMode;
    let autoStart = false;
    
    if (this.timerState.currentMode !== 'work') {
      // 如果当前是休息，下一个是工作
      nextMode = 'work';
      autoStart = this.timerState.settings.autoStartPomodoros;
    } else {
      // 如果当前是工作，计算应该是短休息还是长休息
      if ((this.timerState.completedPomodoros + 1) % this.timerState.settings.longBreakInterval === 0) {
        nextMode = 'longBreak';
      } else {
        nextMode = 'shortBreak';
      }
      autoStart = this.timerState.settings.autoStartBreaks;
      
      // 跳过工作阶段算作完成一个番茄钟
      this.timerState.completedPomodoros++;
      this.statsManager.addCompletedPomodoro();
      this.timerState.dailyStats = this.statsManager.getStats();
    }
    
    // 切换到下一个模式
    this.timerState.currentMode = nextMode;
    
    // 重置计时器但不通知状态变更（将在下面通知）
    this.resetTimerWithoutNotification();
    
    // 如果设置为自动开始，并且当前不在运行状态，则启动计时器
    if (autoStart && this.timerState.status !== 'running') {
      this.timerState.status = 'running';
      this.startTimerAlarm();
    }
    
    // 通知状态变更
    this.notifyStateChange();
  }
  
  // 处理闹钟事件
  handleAlarm(): void {
    this.tickTimer();
  }

  // 更新徽章显示
  private updateBadgeDisplay(): void {
    updateBadge(
      this.timerState.currentMode, 
      this.timerState.timeRemaining, 
      this.timerState.status
    );
  }

  // 启动定时器闹钟
  private startTimerAlarm(): void {
    // 创建一个每秒触发的闹钟
    chrome.alarms.create('timerTick', {
      periodInMinutes: 1 / 60 // 每秒
    });
  }
  
  // 停止定时器闹钟
  private stopTimerAlarm(): void {
    chrome.alarms.clear('timerTick');
  }
  
  // 计时器滴答更新
  private tickTimer(): void {
    if (this.timerState.status !== 'running') return;
    
    // 减少剩余时间
    this.timerState.timeRemaining -= 1;
    
    // 更新显示时间
    this.timerState.displayTime = formatTime(this.timerState.timeRemaining);
    
    // 更新徽章
    this.updateBadgeDisplay();
    
    // 如果是工作模式，增加工作秒数
    if (this.timerState.currentMode === 'work') {
      this.statsManager.addWorkSecond();
      this.timerState.dailyStats = this.statsManager.getStats();
    }
    
    // 检查是否完成
    if (this.timerState.timeRemaining <= 0) {
      this.completePhase();
    } else {
      // 通知状态变更
      this.notifyStateChange();
    }
  }
  
  // 完成一个阶段
  private completePhase(): void {
    console.log('阶段完成:', {
      currentMode: this.timerState.currentMode,
      status: this.timerState.status,
      completedPomodoros: this.timerState.completedPomodoros
    });

    // 停止闹钟
    this.stopTimerAlarm();
    
    // 停止所有声音，确保不会有声音继续播放
    soundController.stopAllSounds();
    
    // 根据当前模式播放完成音效并更新状态
    const prevMode = this.timerState.currentMode;
    
    if (prevMode === 'work') {
      // 工作完成音效
      const workCompleteSound = this.timerState.soundSettings.workCompleteSound;
      if (workCompleteSound !== 'none') {
        soundController.playSound(workCompleteSound);
      }
      
      // 增加完成的番茄钟计数
      this.timerState.completedPomodoros++;
      this.statsManager.addCompletedPomodoro();
      this.timerState.dailyStats = this.statsManager.getStats();
      
      // 切换到休息模式
      if (this.timerState.completedPomodoros % this.timerState.settings.longBreakInterval === 0) {
        this.timerState.currentMode = 'longBreak';
      } else {
        this.timerState.currentMode = 'shortBreak';
      }
      
      // 如果设置为自动开始休息
      if (this.timerState.settings.autoStartBreaks) {
        console.log('自动开始休息');
        
        // 重置时间
        this.resetTimerWithoutNotification();
        
        // 重新开始计时器
        this.timerState.status = 'running';
        this.startTimerAlarm();
      } else {
        // 否则重置为闲置状态
        this.timerState.status = 'idle';
        this.resetTimerWithoutNotification();
      }
    } else {
      // 休息完成音效 - 仅播放一次，确保不会循环
      soundController.stopAllSounds(); // 再次确保所有声音已停止
      const breakCompleteSound = this.timerState.soundSettings.breakCompleteSound;
      if (breakCompleteSound !== 'none') {
        soundController.playSound(breakCompleteSound); // 播放一次，不传递额外参数
      }
      
      // 切换回工作模式
      this.timerState.currentMode = 'work';
      
      // 如果设置为自动开始工作
      if (this.timerState.settings.autoStartPomodoros) {
        console.log('自动开始工作');
        
        // 重置时间
        this.resetTimerWithoutNotification();
        
        // 重新开始计时器
        this.timerState.status = 'running';
        this.startTimerAlarm();
      } else {
        // 否则重置为闲置状态
        this.timerState.status = 'idle';
        this.resetTimerWithoutNotification();
      }
    }
    
    // 显示通知
    this.showNotification(prevMode);
    
    // 确保更新徽章，使其与当前状态一致
    this.updateBadgeDisplay();
    
    // 通知状态变更
    this.notifyStateChange();
  }
  
  // 重置计时器但不通知状态变更
  private resetTimerWithoutNotification(): void {
    // 停止任何运行中的计时器
    this.stopTimerAlarm();
    
    // 停止所有声音，确保不会有声音继续播放
    soundController.stopAllSounds();
    
    // 根据当前模式设置时间
    switch (this.timerState.currentMode) {
      case 'work':
        this.timerState.timeRemaining = this.timerState.settings.workDuration * 60;
        break;
      case 'shortBreak':
        this.timerState.timeRemaining = this.timerState.settings.shortBreakDuration * 60;
        break;
      case 'longBreak':
        this.timerState.timeRemaining = this.timerState.settings.longBreakDuration * 60;
        break;
    }
    
    // 更新显示时间
    this.timerState.displayTime = formatTime(this.timerState.timeRemaining);
    
    // 确保更新徽章，即使不广播状态
    this.updateBadgeDisplay();
  }
  
  // 显示阶段完成通知
  private async showNotification(completedMode: TimerMode): Promise<void> {
    // 根据完成的阶段类型选择标题和消息
    let titleKey, messageKey;
    
    if (completedMode === 'work') {
      titleKey = 'timer.work_complete';
      messageKey = 'notification.time_to_break';
    } else {
      titleKey = 'timer.break_complete';
      messageKey = 'notification.time_to_work';
    }
    
    // 获取语言设置
    let language: 'en' | 'zh' = 'en';
    try {
      const result = await chrome.storage.sync.get(['language']);
      if (result.language === 'en' || result.language === 'zh') {
        language = result.language;
      }
    } catch (error) {
      console.warn('无法获取语言设置，使用默认语言:', error);
    }
    
    // 获取翻译文本
    const title = getTranslationSync(titleKey, language);
    const message = getTranslationSync(messageKey, language);
    
    console.log('显示通知:', {
      completedMode: completedMode,
      title: title,
      message: message
    });
    
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('src/public/icons/icon128.png'),
        title: title,
        message: message,
        priority: 2
      });
    } catch (error) {
      console.error('显示通知出错:', error);
    }
  }
  
  // 通知状态变更
  private notifyStateChange(): void {
    if (this.stateChangeCallback) {
      this.stateChangeCallback(this.timerState);
    }
  }
} 