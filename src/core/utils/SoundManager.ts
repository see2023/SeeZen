export type SoundEffect = 'none' | 'bell' | 'bell_ding' | 'door_close' | 'timer' | 'ticktock';

/**
 * 音效管理器 - 单例模式
 * 用于播放各种音效，包括一次性音效和循环音效（滴答声）
 */
class SoundManager {
  private static instance: SoundManager;
  private audio: HTMLAudioElement | null = null;
  
  private constructor() {
    // 私有构造函数，防止直接创建实例
  }
  
  /**
   * 获取 SoundManager 实例
   */
  public static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }
  
  /**
   * 播放一次性音效
   * @param sound 音效类型
   * @param volume 音量 (0-1)
   */
  public playSound(sound: SoundEffect, volume: number): void {
    if (sound === 'none' || volume <= 0) return;
    
    this.stopSound(); // 停止当前正在播放的声音
    
    // 尝试不同的路径格式
    let soundPath: string;
    
    try {
      // 首先尝试使用chrome.runtime.getURL
      soundPath = chrome.runtime.getURL(`/src/public/sounds/${sound}.mp3`);
      console.log(`Trying to load sound from: ${soundPath}`);
    } catch (error) {
      // 如果失败（例如在开发环境中），使用相对路径
      soundPath = `/sounds/${sound}.mp3`;
      console.log(`Falling back to relative path: ${soundPath}`);
    }
    
    this.audio = new Audio(soundPath);
    this.audio.volume = Math.min(Math.max(volume, 0), 1); // 确保音量在 0-1 范围内
    
    // 添加错误处理
    this.audio.onerror = (e) => {
      console.error(`音效加载失败: ${sound}`, e);
      
      // 尝试备用路径
      const backupPath = `/src/public/sounds/${sound}.mp3`;
      console.log(`Trying backup path: ${backupPath}`);
      
      this.audio = new Audio(backupPath);
      this.audio.volume = Math.min(Math.max(volume, 0), 1);
      
      this.audio.onerror = (e2) => {
        console.error(`备用路径音效加载失败: ${sound}`, e2);
      };
      
      this.audio.play().catch(err => {
        console.error('备用路径音效播放失败:', err);
      });
    };
    
    this.audio.play().catch(err => {
      console.error('音效播放失败:', err);
    });
  }
  
  /**
   * 停止当前正在播放的一次性音效
   */
  public stopSound(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
    }
  }
  
 
  /**
   * 停止所有声音
   */
  public stopAllSounds(): void {
    this.stopSound();
  }
}

export default SoundManager; 