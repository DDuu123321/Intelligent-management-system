// src/utils/consoleOverride.js
// 生产环境console清理和重定向

const logger = require('./logger');

class ConsoleManager {
  constructor() {
    this.originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug
    };
  }

  // 在生产环境中重写console方法
  overrideForProduction() {
    if (process.env.NODE_ENV === 'production') {
      // 重定向到日志系统
      console.log = (...args) => {
        logger.info(this.formatArgs(args));
      };

      console.error = (...args) => {
        logger.error(this.formatArgs(args));
      };

      console.warn = (...args) => {
        logger.warn(this.formatArgs(args));
      };

      console.info = (...args) => {
        logger.info(this.formatArgs(args));
      };

      console.debug = (...args) => {
        logger.debug(this.formatArgs(args));
      };

      console.log('✅ Console已重定向到日志系统');
    }
  }

  // 禁用所有console输出（最严格的生产环境）
  disableForProduction() {
    if (process.env.NODE_ENV === 'production') {
      console.log = () => {};
      console.error = (...args) => {
        // 错误仍然记录到日志
        logger.error(this.formatArgs(args));
      };
      console.warn = () => {};
      console.info = () => {};
      console.debug = () => {};
    }
  }

  // 恢复原始console方法
  restore() {
    Object.assign(console, this.originalConsole);
  }

  // 格式化参数为字符串
  formatArgs(args) {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
  }

  // 开发环境控制台增强
  enhanceForDevelopment() {
    if (process.env.NODE_ENV === 'development') {
      const originalLog = console.log;
      console.log = (...args) => {
        const timestamp = new Date().toISOString();
        originalLog(`[${timestamp}] [LOG]`, ...args);
      };

      const originalError = console.error;
      console.error = (...args) => {
        const timestamp = new Date().toISOString();
        originalError(`[${timestamp}] [ERROR]`, ...args);
      };

      const originalWarn = console.warn;
      console.warn = (...args) => {
        const timestamp = new Date().toISOString();
        originalWarn(`[${timestamp}] [WARN]`, ...args);
      };
    }
  }
}

const consoleManager = new ConsoleManager();

// 根据环境自动配置
if (process.env.NODE_ENV === 'production') {
  // 生产环境：重定向到日志系统
  consoleManager.overrideForProduction();
} else if (process.env.NODE_ENV === 'development') {
  // 开发环境：增强控制台输出
  consoleManager.enhanceForDevelopment();
}

module.exports = consoleManager;