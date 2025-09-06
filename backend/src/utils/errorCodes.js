// src/utils/errorCodes.js
// 统一错误代码及其元数据（HTTP状态、默认消息）。
// 在控制器/服务中优先使用 errorCodes 常量，避免魔法字符串分散。

const errorCodes = {
  VALIDATION_ERROR: { httpStatus: 400, defaultMessage: '数据验证失败' },
  NOT_FOUND: { httpStatus: 404, defaultMessage: '资源不存在' },
  CONFLICT: { httpStatus: 409, defaultMessage: '资源冲突' },
  DUPLICATE: { httpStatus: 409, defaultMessage: '重复数据' },
  INVALID_SEQUENCE: { httpStatus: 400, defaultMessage: '编号序列无效' },
  UNAUTHORIZED: { httpStatus: 401, defaultMessage: '未认证' },
  FORBIDDEN: { httpStatus: 403, defaultMessage: '无权限' },
  AUTH_FAILED: { httpStatus: 401, defaultMessage: '认证失败' },
  INVALID_TOKEN: { httpStatus: 401, defaultMessage: '无效令牌' },
  TOKEN_EXPIRED: { httpStatus: 401, defaultMessage: '令牌已过期' },
  FILE_TOO_LARGE: { httpStatus: 413, defaultMessage: '文件过大' },
  UNEXPECTED_FILE_FIELD: { httpStatus: 400, defaultMessage: '意外的文件字段' },
  UNIQUE_CONSTRAINT: { httpStatus: 409, defaultMessage: '唯一约束冲突' },
  FOREIGN_KEY: { httpStatus: 400, defaultMessage: '外键约束失败' },
  DB_ERROR: { httpStatus: 500, defaultMessage: '数据库错误' },
  BAD_JSON: { httpStatus: 400, defaultMessage: '请求JSON格式错误' },
  SERVER_CONFIG: { httpStatus: 500, defaultMessage: '服务器配置错误' },
  INTERNAL_ERROR: { httpStatus: 500, defaultMessage: '服务器内部错误' },
  APP_ERROR: { httpStatus: 500, defaultMessage: '应用错误' },
  GONE: { httpStatus: 410, defaultMessage: '资源已失效' },
  BLOCKED: { httpStatus: 400, defaultMessage: '操作被阻止' },
  INVALID_QR: { httpStatus: 400, defaultMessage: '无效二维码' },
  UPLOAD_ERROR: { httpStatus: 500, defaultMessage: '上传失败' }
};

function resolveError(code, overrideMessage, details) {
  const meta = errorCodes[code] || { httpStatus: 500, defaultMessage: '服务器内部错误' };
  return {
    status: meta.httpStatus,
    message: overrideMessage || meta.defaultMessage,
    payload: { error: { code, ...(details ? { details } : {}) } }
  };
}

module.exports = { errorCodes, resolveError };
