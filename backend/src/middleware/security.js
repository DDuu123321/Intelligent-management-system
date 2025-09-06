// src/middleware/security.js
const rateLimit = require('express-rate-limit');
const config = require('../config/config');

/**
 * 速率限制中间件
 */
const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 登录速率限制 - 更严格的限制
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: {
    success: false,
    message: '登录尝试过多，请15分钟后再试'
  },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * HTTPS重定向中间件
 */
function httpsRedirect(req, res, next) {
  if (config.security?.forceHttps && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
}

/**
 * 安全头部中间件
 */
function securityHeaders(req, res, next) {
  // 防止点击劫持
  res.setHeader('X-Frame-Options', 'DENY');
  
  // 防止MIME类型嗅探
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS保护
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // 严格传输安全
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // 引用策略
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // 内容安全策略
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
  
  next();
}

/**
 * 输入清理中间件
 */
function sanitizeInput(req, res, next) {
  // 基本的输入清理
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // 移除潜在的恶意字符
        req.body[key] = req.body[key].trim();
        // 可以添加更多清理规则
      }
    });
  }
  next();
}

module.exports = {
  rateLimiter,
  loginRateLimiter,
  httpsRedirect,
  securityHeaders,
  sanitizeInput
};