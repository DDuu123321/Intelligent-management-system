// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { resolveError } = require('../utils/errorCodes');

const authenticateToken = async (req, res, next) => {
  try {
    const header = req.header('Authorization');
    if (!header || !header.startsWith('Bearer ')) {
      const { status, message, payload } = resolveError('UNAUTHORIZED', '缺少认证头');
      return res.standard(payload, { message, status });
    }
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id || decoded.userId);
    if (!user || user.status !== 'active') {
      const { status, message, payload } = resolveError('INVALID_TOKEN');
      return res.standard(payload, { message, status });
    }
    req.user = {
      id: user.id,
      username: user.username,
      employee_id: user.employee_id,
      role: user.role,
      ...decoded
    };
    return next();
  } catch (err) {
    console.error('认证失败:', err);
    const { status, message, payload } = resolveError('UNAUTHORIZED', '未能验证令牌');
    return res.standard(payload, { message, status });
  }
};

module.exports = { authenticateToken };