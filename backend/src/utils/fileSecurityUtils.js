// src/utils/fileSecurityUtils.js
const sanitizeFilename = require('sanitize-filename');
const path = require('path');

/**
 * 安全化文件名，防止路径遍历和恶意文件名
 * @param {string} filename - 原始文件名
 * @returns {string} - 安全化后的文件名
 */
const sanitizeFileName = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return 'unknown_file';
  }

  // 使用 sanitize-filename 库基础清理
  let sanitized = sanitizeFilename(filename);
  
  // 额外安全检查
  sanitized = sanitized
    .replace(/\.\./g, '') // 移除路径遍历
    .replace(/[<>:"|?*]/g, '_') // 替换Windows不允许的字符
    .replace(/\s+/g, '_') // 空格替换为下划线
    .replace(/_{2,}/g, '_') // 多个下划线合并为一个
    .toLowerCase(); // 转小写避免大小写问题

  // 检测双扩展名攻击 (如 file.jpg.exe)
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    // 保留最后一个扩展名
    const ext = parts.pop();
    const name = parts.join('_');
    sanitized = `${name}.${ext}`;
  }

  // 确保文件名不为空且有合理长度
  if (!sanitized || sanitized === '.' || sanitized.length > 255) {
    const timestamp = Date.now();
    sanitized = `file_${timestamp}`;
  }

  return sanitized;
};

/**
 * 验证文件类型是否允许
 * @param {string} mimetype - 文件MIME类型
 * @param {string} originalname - 原始文件名
 * @returns {boolean} - 是否允许上传
 */
const isAllowedFileType = (mimetype, originalname) => {
  const allowedMimeTypes = (process.env.LICENSE_ALLOWED_MIME || 
    'image/jpeg,image/png,image/gif,image/webp,application/pdf').split(',');
  
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
  
  // 检查MIME类型
  if (!allowedMimeTypes.includes(mimetype)) {
    return false;
  }

  // 检查文件扩展名
  const ext = path.extname(originalname).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return false;
  }

  return true;
};

/**
 * 生成唯一的安全文件名
 * @param {string} originalName - 原始文件名
 * @returns {string} - 唯一的安全文件名
 */
const generateUniqueFileName = (originalName) => {
  const ext = path.extname(originalName);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitizedName = sanitizeFileName(path.basename(originalName, ext));
  
  return `${timestamp}_${random}_${sanitizedName}${ext}`;
};

module.exports = {
  sanitizeFileName,
  isAllowedFileType,
  generateUniqueFileName
};
