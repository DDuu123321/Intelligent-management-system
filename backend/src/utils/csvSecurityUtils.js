// src/utils/csvSecurityUtils.js
/**
 * CSV字段安全转义工具
 * 修复CSV导出字段转义安全漏洞
 */

/**
 * 转义CSV字段中的特殊字符
 * @param {any} value - 需要转义的值
 * @returns {string} - 转义后的字符串
 */
function escapeCsvField(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  // 转换为字符串
  let str = String(value);
  
  // 如果字段包含特殊字符，需要用引号包围并转义内部引号
  const needsQuoting = /[",\r\n]/.test(str);
  
  if (needsQuoting) {
    // 转义内部的引号（双引号变成两个双引号）
    str = str.replace(/"/g, '""');
    // 用引号包围整个字段
    str = `"${str}"`;
  }
  
  return str;
}

/**
 * 生成安全的CSV行
 * @param {Array} fields - 字段数组
 * @returns {string} - CSV行字符串
 */
function generateCsvRow(fields) {
  return fields.map(field => escapeCsvField(field)).join(',');
}

/**
 * 生成完整的CSV内容
 * @param {Array} headers - 表头数组
 * @param {Array} rows - 数据行数组（每行是字段数组）
 * @returns {string} - 完整的CSV内容
 */
function generateCsvContent(headers, rows) {
  const csvRows = [generateCsvRow(headers)];
  
  for (const row of rows) {
    csvRows.push(generateCsvRow(row));
  }
  
  // 添加BOM以支持Excel正确显示UTF-8
  return '\ufeff' + csvRows.join('\n');
}

/**
 * 设置CSV响应头
 * @param {Response} res - Express响应对象
 * @param {string} filename - 文件名
 */
function setCsvResponseHeaders(res, filename = 'export.csv') {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
}

module.exports = {
  escapeCsvField,
  generateCsvRow,
  generateCsvContent,
  setCsvResponseHeaders
};
