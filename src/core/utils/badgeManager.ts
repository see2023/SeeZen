/**
 * 更新扩展图标徽章
 * 根据当前状态设置徽章文本和颜色
 */
export function updateBadge(
  phase: 'work' | 'shortBreak' | 'longBreak',
  timeRemaining: number,
  status: 'idle' | 'running' | 'paused'
): void {
  // 选择徽章背景颜色
  let color: string;
  switch (phase) {
    case 'work':
      color = '#F44336'; // 红色
      break;
    case 'shortBreak':
      color = '#4CAF50'; // 绿色
      break;
    case 'longBreak':
      color = '#2196F3'; // 蓝色
      break;
    default:
      color = '#F44336';
  }
  
  // 如果暂停，使用灰色
  if (status === 'paused') {
    color = '#9E9E9E'; // 灰色
  }
  
  // 设置徽章背景色
  if (chrome && chrome.action) {
    chrome.action.setBadgeBackgroundColor({ color });
  }
  
  // 格式化显示文本
  let badgeText = '';
  if (status === 'paused') {
    badgeText = 'II'; // 显示暂停符号
  } else {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    
    if (minutes >= 10) {
      badgeText = minutes.toString();
    } else if (minutes > 0) {
      // 格式化为 "m:ss"，并确保长度不超过4个字符
      badgeText = `${minutes}:${seconds.toString().padStart(2, '0')}`.substring(0, 4);
    } else {
      badgeText = `:${seconds.toString().padStart(2, '0')}`.substring(0, 4);
    }
  }
  
  // 设置徽章文本
  if (chrome && chrome.action) {
    chrome.action.setBadgeText({ text: badgeText });
  }
}

/**
 * 清除徽章显示
 */
export function clearBadge(): void {
  if (chrome && chrome.action) {
    chrome.action.setBadgeText({ text: '' });
  }
}

/**
 * 格式化时间显示（用于UI显示，非徽章）
 * @param seconds 总秒数
 * @returns 格式化后的时间字符串 "mm:ss"
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
} 