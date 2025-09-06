// src/utils/passwordUtils.js
const bcrypt = require('bcryptjs');
const config = require('../config/config');

/**
 * 密码复杂度验证
 */
function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];

  if (password.length < minLength) {
    errors.push(`密码长度至少${minLength}个字符`);
  }
  
  if (!hasUpper) {
    errors.push('密码必须包含大写字母');
  }
  
  if (!hasLower) {
    errors.push('密码必须包含小写字母');
  }
  
  if (!hasNumbers) {
    errors.push('密码必须包含数字');
  }
  
  if (!hasSpecial) {
    errors.push('密码必须包含特殊字符');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 生成安全随机密码
 */
function generateSecurePassword(length = 12) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // 确保至少包含每种字符类型
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  // 填充剩余长度
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // 打乱字符顺序
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * 哈希密码
 */
async function hashPassword(password) {
  const rounds = config.security.bcryptRounds;
  return await bcrypt.hash(password, rounds);
}

/**
 * 验证密码
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

module.exports = {
  validatePasswordStrength,
  generateSecurePassword,
  hashPassword,
  verifyPassword
};