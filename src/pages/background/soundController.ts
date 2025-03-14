import { SoundEffect } from '../../core/utils/SoundManager';

// 缓存音量设置
let cachedSoundVolume: number | undefined = undefined;

/**
 * 更新音量设置
 */
export function updateVolumeSettings(volume: number): void {
  cachedSoundVolume = volume;
  console.log('已缓存音量设置:', cachedSoundVolume);
}

/**
 * 获取当前设置的音量
 */
export async function getVolume(): Promise<number> {
  // 优先使用缓存的音量
  if (cachedSoundVolume !== undefined) {
    console.log('使用缓存的音量设置:', cachedSoundVolume);
    return cachedSoundVolume;
  }
  
  // 否则从存储获取
  try {
    const result = await chrome.storage.sync.get(['uiSettings']);
    if (result.uiSettings && typeof result.uiSettings.soundVolume === 'number') {
      const volume = result.uiSettings.soundVolume;
      // 缓存获取到的音量
      cachedSoundVolume = volume;
      console.log('从存储获取的音量设置:', volume);
      return volume;
    }
  } catch (error) {
    console.warn('获取音量设置失败，使用默认值:', error);
  }
  
  // 默认音量
  return 0.7;
}

/**
 * 播放一次性声音
 */
export async function playSound(sound: SoundEffect, volume?: number): Promise<void> {
  if (sound === 'none') return;

  try {
    // 如果没有提供音量参数，获取设置的音量
    if (volume === undefined) {
      volume = await getVolume();
    }
    
    console.log(`准备播放声音: ${sound}, 音量: ${volume}`);
    
    // 确保offscreen文档存在
    await ensureOffscreenDocumentExists();
    
    // 发送消息到offscreen文档播放声音
    await chrome.runtime.sendMessage({
      target: 'offscreen',
      action: 'playSound',
      sound: sound,
      volume: volume
    });
  } catch (error) {
    console.error(`播放声音出错: ${error}`);
  }
}


/**
 * 停止所有声音
 */
export async function stopAllSounds(): Promise<void> {
  try {
    console.log('准备停止所有声音');
    
    // 检查是否已存在offscreen文档
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType]
    });
    
    if (existingContexts && existingContexts.length > 0) {
      // 发送消息到offscreen文档停止所有声音
      await chrome.runtime.sendMessage({
        target: 'offscreen',
        action: 'stopAllSounds'
      });
    }
  } catch (error) {
    console.error(`停止所有声音出错: ${error}`);
  }
}

/**
 * 确保offscreen文档存在
 */
async function ensureOffscreenDocumentExists(): Promise<void> {
  // 检查是否已存在offscreen文档
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType]
  });

  console.log('检查offscreen文档状态:', {
    existingContextsCount: existingContexts ? existingContexts.length : 0,
    existingContexts: existingContexts
  });

  // 如果不存在，创建offscreen文档
  if (!existingContexts || existingContexts.length === 0) {
    try {
      console.log('准备创建offscreen文档');
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['AUDIO_PLAYBACK'],
        justification: 'Playing timer sounds'
      });
      
      // 等待文档创建完成
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('已创建offscreen文档');
    } catch (error) {
      // 如果是"已存在"的错误，可以忽略
      if (error instanceof Error && error.message.includes('Only a single offscreen document')) {
        console.log('Offscreen文档已存在（创建时检测）');
      } else {
        console.error('创建offscreen文档出错:', error);
        throw error;
      }
    }
  }
} 