// 前端日志工具
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  source: string;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private createEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
  ): LogEntry {
    return {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      source: "frontend",
    };
  }

  private formatMessage(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    return `[${entry.timestamp}] ${levelName}: ${entry.message}`;
  }

  error(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createEntry(LogLevel.ERROR, message, data);
      const originalConsole = (window as any).__originalConsole;
      if (originalConsole) {
        originalConsole.error(this.formatMessage(entry), data);
      }

      // 在生产环境中可以发送到日志服务
      if (!this.isDevelopment) {
        this.sendToLogService(entry);
      }
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createEntry(LogLevel.WARN, message, data);
      const originalConsole = (window as any).__originalConsole;
      if (originalConsole) {
        originalConsole.warn(this.formatMessage(entry), data);
      }
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createEntry(LogLevel.INFO, message, data);
      const originalConsole = (window as any).__originalConsole;
      if (originalConsole) {
        originalConsole.info(this.formatMessage(entry), data);
      }
    }
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createEntry(LogLevel.DEBUG, message, data);
      const originalConsole = (window as any).__originalConsole;
      if (originalConsole) {
        originalConsole.log(this.formatMessage(entry), data);
      }
    }
  }

  private async sendToLogService(entry: LogEntry): Promise<void> {
    try {
      // 这里可以集成第三方日志服务，如 Sentry, LogRocket 等
      // await fetch('/api/v1/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // })
    } catch (error) {
      // 静默处理日志服务错误，避免影响主要功能
    }
  }

  // 设置日志级别
  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

// 创建全局日志实例
export const logger = new Logger();

// 保存原始console方法，避免无限递归
const originalConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

// 导出原始console用于logger内部使用
(window as any).__originalConsole = originalConsole;

export default logger;
