// src/utils/logger.js
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    return JSON.stringify(logEntry);
  }

  writeToFile(level, formattedMessage) {
    const filename = `${level}-${new Date().toISOString().split('T')[0]}.log`;
    const filepath = path.join(this.logDir, filename);
    
    fs.appendFileSync(filepath, formattedMessage + '\n', { encoding: 'utf8' });
  }

  log(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // 控制台输出 (仅开发环境)
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        error: '\x1b[31m',
        warn: '\x1b[33m',
        info: '\x1b[36m',
        debug: '\x1b[90m',
        reset: '\x1b[0m'
      };
      
      const color = colors[level] || colors.reset;
      console.log(`${color}[${level.toUpperCase()}]${colors.reset} ${message}`, meta);
    }

    // 文件输出 (所有环境，但生产环境只记录warn及以上级别)
    const shouldWriteToFile = process.env.NODE_ENV === 'production' 
      ? ['error', 'warn'].includes(level)
      : true;
      
    if (shouldWriteToFile) {
      this.writeToFile(level, formattedMessage);
    }
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // HTTP请求日志中间件
  requestLogger() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.info('HTTP Request', {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });

      next();
    };
  }
}

// 导出实例
const logger = new Logger();

module.exports = logger;