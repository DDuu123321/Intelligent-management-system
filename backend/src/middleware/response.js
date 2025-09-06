// middleware/response.js
// 统一标准响应中间件：不覆盖 res.json，提供 res.standard()
// 使用：return res.standard(payload, { message: '描述', status: 200 });
// 错误：return res.standard({ error: { code: 'VALIDATION_ERROR', details } }, { message: '验证失败', status: 400 });

module.exports = function responseMiddleware(req, res, next) {
  res.standard = (payload = null, { message = 'Success', status = 200 } = {}) => {
    const base = {
      success: status < 400,
      message,
      data: status < 400 ? payload : null,
      ...(status >= 400 && payload && payload.error ? { error: payload.error } : {}),
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    };
    return res.status(status).json(base);
  };
  next();
};
