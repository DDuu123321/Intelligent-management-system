// src/utils/response.js
// 旧版响应辅助函数 (将被 responseMiddleware 替代) - Deprecated
// 保留一段兼容期后删除。

function successResponse(data = null, message = 'Success') {
  return { success: true, message, data };
}

function errorResponse(message = 'Error', data = null) {
  return { success: false, message, data };
}

// 不再建议使用以下直接操作 res 的方法
function success(res, status = 200, message = 'Success', data = null) {
  return res.status(status).json({ success: true, message, data });
}

function error(res, status = 500, message = 'Error', details = null) {
  return res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
}

module.exports = { successResponse, errorResponse, success, error };