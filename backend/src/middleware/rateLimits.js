// src/middleware/rateLimits.js
const rateLimit = require('express-rate-limit');

// 登录速率限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次登录尝试
  message: {
    success: false,
    message: '登录尝试次数过多，请15分钟后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 成功登录不计入限制
});

// 文件上传速率限制
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 20, // 最多20次上传
  message: {
    success: false,
    message: '上传次数过多，请15分钟后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 批量导入速率限制 (更严格)
const batchImportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1小时
  max: 5, // 最多5次批量导入
  message: {
    success: false,
    message: '批量导入次数过多，请1小时后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 一般API速率限制
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 最多100次请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  loginLimiter,
  uploadLimiter,
  batchImportLimiter,
  generalLimiter
};
