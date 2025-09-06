// src/middleware/globalErrorHandler.js
// NOTE: successResponse/errorResponse deprecated; migrating to res.standard
const { errorCodes, resolveError } = require('../utils/errorCodes');

/**
 * 全局错误处理中间件
 * 统一处理所有路由的错误，提供一致的错误响应格式
 */
const globalErrorHandler = (err, req, res, next) => {
  // 记录错误日志（包含请求信息）
  const logger = require('../utils/logger');
  logger.error(`Error in ${req.method} ${req.originalUrl}`, {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    user: req.user ? { id: req.user.userId, role: req.user.role } : 'anonymous',
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent')
  });

  const send = (code, overrideMessage, details) => {
    const { status, message, payload } = resolveError(code, overrideMessage, details);
    return res.standard(payload, { message, status });
  };

  // Multer 错误处理
  if (err.code === 'LIMIT_FILE_SIZE') {
    return send('FILE_TOO_LARGE');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return send('UNEXPECTED_FILE_FIELD');
  }

  // Sequelize 验证错误
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
    return send('VALIDATION_ERROR', '数据验证失败', errors);
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'unknown';
    return send('UNIQUE_CONSTRAINT', `${field} 已存在`);
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return send('FOREIGN_KEY');
  }
  if (err.name === 'SequelizeDatabaseError') {
    return send('DB_ERROR');
  }

  // JWT 错误处理
  if (err.name === 'JsonWebTokenError') {
    return send('INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return send('TOKEN_EXPIRED');
  }

  // JSON 解析错误
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return send('BAD_JSON');
  }

  // 自定义错误处理
  if (err.statusCode) {
    return send(err.code || 'APP_ERROR', err.message);
  }

  // 默认服务器错误
  return send('INTERNAL_ERROR', process.env.NODE_ENV === 'production' ? undefined : (err.message || '未知错误'));
};

/**
 * 404 错误处理中间件
 */
const notFoundHandler = (req, res) => {
  const { status, message, payload } = resolveError('NOT_FOUND', `路由 ${req.originalUrl} 不存在`);
  return res.standard(payload, { message, status });
};

/**
 * 创建自定义错误
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  globalErrorHandler,
  notFoundHandler,
  AppError
};
