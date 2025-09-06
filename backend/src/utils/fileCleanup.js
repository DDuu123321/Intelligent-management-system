// src/utils/fileCleanup.js
const fs = require('fs').promises;
const path = require('path');

/**
 * 安全删除文件
 * @param {string} filePath - 要删除的文件路径
 * @returns {boolean} - 是否删除成功
 */
const safeDeleteFile = async (filePath) => {
  if (!filePath) return true;
  
  try {
    // 确保文件路径在允许的目录内（防止路径遍历攻击）
    const uploadsDir = path.join(__dirname, '../../uploads');
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadsDir = path.resolve(uploadsDir);
    
    if (!resolvedPath.startsWith(resolvedUploadsDir)) {
      console.warn('尝试删除上传目录外的文件:', filePath);
      return false;
    }
    
    // 检查文件是否存在
    await fs.access(resolvedPath);
    
    // 删除文件
    await fs.unlink(resolvedPath);
    console.log('文件删除成功:', filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // 文件不存在，视为删除成功
      console.log('文件不存在，无需删除:', filePath);
      return true;
    }
    console.error('删除文件失败:', filePath, error.message);
    return false;
  }
};

/**
 * 清理孤儿文件（删除记录时同步删除文件）
 * @param {string} oldFilePath - 旧文件路径
 * @param {string} newFilePath - 新文件路径（可选）
 */
const cleanupOldFile = async (oldFilePath, newFilePath = null) => {
  // 如果新旧文件路径相同，不删除
  if (oldFilePath === newFilePath) return;
  
  // 如果有旧文件且与新文件不同，删除旧文件
  if (oldFilePath && oldFilePath !== newFilePath) {
    await safeDeleteFile(oldFilePath);
  }
};

/**
 * 批量清理文件
 * @param {string[]} filePaths - 文件路径数组
 * @returns {Object} - 清理结果统计
 */
const batchCleanupFiles = async (filePaths) => {
  const results = {
    total: filePaths.length,
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (const filePath of filePaths) {
    try {
      const success = await safeDeleteFile(filePath);
      if (success) {
        results.success++;
      } else {
        results.failed++;
        results.errors.push({ filePath, error: '删除失败' });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({ filePath, error: error.message });
    }
  }
  
  return results;
};

/**
 * 获取文件大小
 * @param {string} filePath - 文件路径
 * @returns {number} - 文件大小（字节）
 */
const getFileSize = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    console.error('获取文件大小失败:', filePath, error.message);
    return 0;
  }
};

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} - 文件是否存在
 */
const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  safeDeleteFile,
  cleanupOldFile,
  batchCleanupFiles,
  getFileSize,
  fileExists
};
