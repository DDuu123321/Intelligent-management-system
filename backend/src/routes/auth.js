// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// 登录路由
router.post('/login', authController.login);

// 登出路由
router.post('/logout', authController.logout);

// 获取用户信息路由（需要认证）
router.get('/profile', authenticateToken, authController.profile);

// 更新用户信息路由（需要认证）
router.put('/profile', authenticateToken, authController.updateProfile);

// 验证token路由
router.get('/verify', authenticateToken, (req, res) => {
  return res.standard({ user: req.user }, { message: 'Token有效' });
});

module.exports = router;