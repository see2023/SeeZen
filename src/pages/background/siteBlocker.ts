// SeeZen 网站阻止器模块

// Check if current time is within scheduled work hours
function isWithinScheduledTime(days: number[], timeRanges: Array<{ start: string, end: string }>): boolean {
  const now = new Date();
  const currentDay = now.getDay(); // 0-6, starting with Sunday
  
  // First check if today is a scheduled day
  if (!days.includes(currentDay)) {
    return false;
  }
  
  // Then check if current time is within any of the scheduled ranges
  const currentTime = now.getHours() * 100 + now.getMinutes();
  const formattedTime = currentTime.toString().padStart(4, '0');
  
  return timeRanges.some(range => {
    return formattedTime >= range.start && formattedTime <= range.end;
  });
}


// Generates the URL for the blocked page with stats
function getBlockedPageUrl(originalUrl?: string): string {
  const now = new Date();
  const currentTime = now.toLocaleTimeString();
  // URL to the blocked page's HTML file
  const blockedPageUrl = chrome.runtime.getURL('src/pages/blocked/index.html');
  const params = new URLSearchParams();
  params.append('time', currentTime);
  if (originalUrl) {
    params.append('url', encodeURIComponent(originalUrl));
  }
  return `${blockedPageUrl}?${params.toString()}`;
}

// 设置导航拦截器，处理所有网站阻止
export function setupWebNavigationBlocker() {
  console.log('初始化网站阻止器');
  
  // 立即检查已打开标签页
  checkOpenTabsBasedOnSettings();
  
  // 监听设置变化
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.blockerSettings || changes.timerState) {
      console.log('检测到设置变化，重新检查已打开标签页', changes);
      checkOpenTabsBasedOnSettings();
    }
  });
  
  // 定期检查已打开标签页（用于时间表规则）
  setInterval(checkOpenTabsBasedOnSettings, 60000); // 每分钟检查一次
  
  // 监听网络导航事件
  chrome.webNavigation.onBeforeNavigate.addListener(
    (details) => {
      // 忽略子框架，只处理主框架导航
      if (details.frameId !== 0) return;
      
      // 直接检查当前导航是否应该被阻止
      shouldBlockNavigation(details.url, details.tabId);
    }
  );
}

// 检查已打开的标签页是否应该被阻止
async function checkOpenTabsBasedOnSettings() {
  try {
    // 先检查阻止是否应该激活
    const blockingInfo = await isBlockingActive();
    
    // 如果不应该阻止，直接返回
    if (!blockingInfo.active) {
      console.log('阻止功能当前已禁用，跳过检查已打开标签页');
      return;
    }
    
    // 获取被阻止的站点列表
    const blockedSites = blockingInfo.blockedSites;
    
    // 如果没有被阻止的站点，直接返回
    if (!blockedSites || blockedSites.length === 0) {
      console.log('没有设置被阻止的站点，跳过检查已打开标签页');
      return;
    }
    
    console.log(`准备检查已打开标签页，阻止列表: ${blockedSites.join(', ')}`);
    
    // 检查已打开的标签页
    const tabs = await chrome.tabs.query({});
    
    // 检查每个标签页
    for (const tab of tabs) {
      // 跳过没有URL的标签页
      if (!tab.url || !tab.id) continue;
      
      // 跳过已经是阻止页面的标签页
      if (tab.url.includes(chrome.runtime.getURL('src/pages/blocked/index.html'))) continue;
      
      try {
        // 检查标签页URL是否匹配任何被阻止的站点
        const tabUrl = new URL(tab.url);
        const tabHostname = tabUrl.hostname;
        
        if (!tabHostname) continue;
        
        // 检查是否匹配任何被阻止的站点
        for (const site of blockedSites) {
          if (!site) continue;
          
          // 匹配确切域名或子域名
          if (tabHostname === site || tabHostname.endsWith(`.${site}`)) {
            console.log(`检测到已打开的被阻止站点: ${tabUrl} (匹配 ${site})`);
            // 重定向标签页到阻止页面
            chrome.tabs.update(tab.id, { url: getBlockedPageUrl(tab.url) });
            break;
          }
        }
      } catch (urlError) {
        console.error(`URL解析错误: ${tab.url}`, urlError);
      }
    }
  } catch (error) {
    console.error('检查已打开标签页时出错:', error);
  }
}

// 检查特定导航是否应该被阻止
async function shouldBlockNavigation(url: string, tabId: number) {
  try {
    // 跳过扩展自身的 URL
    if (url.startsWith(chrome.runtime.getURL(''))) {
      return;
    }
    
    // 检查阻止功能是否激活
    const blockingInfo = await isBlockingActive();
    
    // 如果阻止功能未激活，记录并不阻止导航
    if (!blockingInfo.active) {
      console.log(`不阻止导航: ${url} (阻止未激活)`);
      return;
    }
    
    // 获取被阻止的站点列表
    const blockedSites = blockingInfo.blockedSites;
    
    // 如果没有被阻止的站点，不阻止导航
    if (!blockedSites || blockedSites.length === 0) {
      console.log(`不阻止导航: ${url} (无阻止站点)`);
      return;
    }
    
    // 检查URL是否匹配任何被阻止的站点
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // 如果域名为空，不阻止
      if (!hostname) {
        console.log(`不阻止导航: ${url} (域名为空)`);
        return;
      }
      
      let shouldBlockThisUrl = false;
      let matchedSite = '';
      
      // 检查是否匹配任何被阻止的站点
      for (const site of blockedSites) {
        // 如果阻止站点为空，跳过
        if (!site) continue;
        
        // 匹配确切域名或子域名
        if (hostname === site || hostname.endsWith(`.${site}`)) {
          shouldBlockThisUrl = true;
          matchedSite = site;
          break;
        }
      }
      
      if (shouldBlockThisUrl) {
        console.log(`阻止导航到: ${url} (匹配 ${matchedSite})`);
        // 重定向到阻止页面
        chrome.tabs.update(tabId, { url: getBlockedPageUrl(url) });
      } else {
        console.log(`不阻止导航: ${url} (未匹配任何阻止站点)`);
      }
    } catch (urlError) {
      console.error(`URL解析错误: ${url}`, urlError);
    }
  } catch (error) {
    console.error('检查导航时出错:', error);
  }
}

// 检查阻止功能是否应该激活
async function isBlockingActive(): Promise<{ active: boolean, blockedSites: string[] }> {
  // 默认返回值：不激活，没有阻止站点
  const defaultResult = { active: false, blockedSites: [] };
  
  try {
    // 分别获取两个存储中的设置
    // 1. 从sync存储中获取阻止设置
    const syncResult = await chrome.storage.sync.get(['blockerSettings']);
    // 2. 从local存储中获取计时器状态
    const localResult = await chrome.storage.local.get(['timerState']);
    
    const { blockerSettings } = syncResult;
    const { timerState } = localResult;
    
    console.log('从存储获取的数据:', {
      blockerSettings: blockerSettings ? '已获取' : '未获取',
      timerState: timerState ? '已获取' : '未获取'
    });
    
    // 如果没有阻止设置，返回默认值
    if (!blockerSettings) {
      console.log('未找到阻止设置');
      return defaultResult;
    }
    
    const { 
      mode, 
      enabledDuringWork = false, 
      scheduleEnabled = false, 
      workSchedule, 
      blockedSites = [] 
    } = blockerSettings;
    
    // 检查网站黑名单是否为空
    if (!blockedSites || blockedSites.length === 0) {
      console.log('阻止站点列表为空，不启用阻止');
      return defaultResult;
    }
    
    // 检查是否所有设置都被禁用
    if (mode !== 'pomodoro' && mode !== 'schedule') {
      console.log(`未知阻止模式: ${mode}`);
      return defaultResult;
    }
    
    // 确定阻止是否应该激活
    let isActive = false;
    let reason = '';
    
    if (mode === 'pomodoro') {
      // 输出完整的timerState结构，帮助调试
      console.log('番茄钟模式检查，timerState详情:', JSON.stringify(timerState, null, 2));
      
      // 番茄钟模式需要明确启用
      if (!enabledDuringWork) {
        reason = '番茄钟模式阻止未启用';
        isActive = false;
      } else if (!timerState) {
        reason = '番茄钟状态不存在';
        isActive = false;
      } else {
        // 兼容处理可能的不同timerState结构
        const isWorkMode = timerState.currentMode === 'work';
        const isRunning = timerState.status === 'running';
        
        if (!isWorkMode) {
          reason = `番茄钟不在工作模式中 (当前: ${timerState.currentMode})`;
          isActive = false;
        } else if (!isRunning) {
          reason = `番茄钟未运行 (当前: ${timerState.status})`;
          isActive = false;
        } else {
          reason = '番茄钟工作模式运行中且阻止已启用';
          isActive = true;
        }
      }
    } else if (mode === 'schedule') {
      // 时间表模式需要明确启用
      if (!scheduleEnabled) {
        reason = '时间表模式阻止未启用';
        isActive = false;
      } else if (!workSchedule || !workSchedule.days || !workSchedule.timeRanges) {
        reason = '时间表配置不完整';
        isActive = false;
      } else {
        isActive = isWithinScheduledTime(workSchedule.days, workSchedule.timeRanges);
        reason = isActive ? '当前时间在工作时间段内' : '当前时间不在工作时间段内';
      }
    }
    
    console.log(`阻止状态: ${isActive ? '激活' : '未激活'}, 原因: ${reason}`, {
      mode,
      enabledDuringWork,
      scheduleEnabled,
      blockedSitesCount: blockedSites.length
    });
    
    // 返回阻止状态和被阻止的站点列表
    return {
      active: isActive,
      blockedSites: isActive ? blockedSites : []
    };
  } catch (error) {
    console.error('检查阻止状态时出错:', error);
    return defaultResult;
  }
} 