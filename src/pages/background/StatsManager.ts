// 统计管理器，处理所有与统计相关的功能
export interface DailyStats {
  date: string;                    // 日期，格式 YYYY-MM-DD
  workSeconds: number;             // 工作秒数
  pomodorosCompleted: number;      // 完成的番茄数
}

export class StatsManager {
  private dailyStats: DailyStats;
  private lastCheckTime: number = 0;
  private readonly CHECK_INTERVAL: number = 60000; // 每分钟检查一次日期变更

  constructor() {
    this.dailyStats = {
      date: this.getTodayDateString(),
      workSeconds: 0,
      pomodorosCompleted: 0
    };
  }

  // 初始化统计数据（从存储加载或重置）
  async initialize(savedStats?: DailyStats): Promise<void> {
    const today = this.getTodayDateString();
    
    if (savedStats && savedStats.date === today) {
      // 如果保存的统计是今天的，使用它们
      this.dailyStats = savedStats;
    } else {
      // 如果不是今天的统计，重置为今天的新统计
      this.resetForNewDay();
    }

    // 启动日期变更检查
    this.startDateChangeCheck();
  }

  // 获取当前统计数据
  getStats(): DailyStats {
    return { ...this.dailyStats };
  }

  // 增加工作秒数
  addWorkSecond(): void {
    this.checkDateChange();
    this.dailyStats.workSeconds += 1;
  }

  // 增加完成的番茄数
  addCompletedPomodoro(): void {
    this.checkDateChange();
    this.dailyStats.pomodorosCompleted += 1;
  }

  // 重置为新的一天
  resetForNewDay(): void {
    this.dailyStats = {
      date: this.getTodayDateString(),
      workSeconds: 0,
      pomodorosCompleted: 0
    };
    console.log('统计数据已重置为新的一天:', this.dailyStats);
  }

  // 获取今日日期字符串
  private getTodayDateString(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  // 检查日期是否已变更
  private checkDateChange(): void {
    const now = Date.now();
    const today = this.getTodayDateString();
    
    // 如果日期已变更，重置统计
    if (today !== this.dailyStats.date) {
      console.log('检测到日期变更，从', this.dailyStats.date, '到', today);
      this.resetForNewDay();
    }
    
    this.lastCheckTime = now;
  }

  // 启动日期变更检查（定期检查日期是否变更）
  private startDateChangeCheck(): void {
    setInterval(() => this.checkDateChange(), this.CHECK_INTERVAL);
  }
} 