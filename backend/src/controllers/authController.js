// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authController = {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.standard({ error: { code: 'VALIDATION_ERROR' } }, { message: '用户名和密码不能为空', status: 400 });
      }
      const user = await User.findOne({ where: { username } });
      if (!user) {
        return res.standard({ error: { code: 'AUTH_FAILED' } }, { message: '用户名或密码错误', status: 401 });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.standard({ error: { code: 'AUTH_FAILED' } }, { message: '用户名或密码错误', status: 401 });
      }
      if (!process.env.JWT_SECRET) {
        return res.standard({ error: { code: 'SERVER_CONFIG', details: 'JWT_SECRET 未配置' } }, { message: '服务器配置错误', status: 500 });
      }
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.standard({
        token,
        user: { id: user.id, username: user.username, name: user.name, role: user.role, email: user.email }
      }, { message: '登录成功', status: 200 });
    } catch (error) {
      console.error('Login error:', error);
      return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: '服务器内部错误', status: 500 });
    }
  },
  async logout(req, res) {
    try {
      return res.standard(null, { message: '登出成功', status: 200 });
    } catch (error) {
      console.error('Logout error:', error);
      return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: '服务器内部错误', status: 500 });
    }
  },
  async profile(req, res) {
    try {
      const user = await User.findByPk(req.user.userId, { attributes: { exclude: ['password'] } });
      if (!user) {
        return res.standard({ error: { code: 'NOT_FOUND' } }, { message: '用户不存在', status: 404 });
      }
      return res.standard(user, { message: '获取用户信息成功', status: 200 });
    } catch (error) {
      console.error('Profile error:', error);
      return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: '服务器内部错误', status: 500 });
    }
  },
  async updateProfile(req, res) {
    try {
      const { email, name } = req.body;
      const userId = req.user.userId;
      const user = await User.findByPk(userId);
      if (!user) {
        return res.standard({ error: { code: 'NOT_FOUND' } }, { message: '用户不存在', status: 404 });
      }
      await user.update({ email: email || user.email, name: name || user.name });
      return res.standard({ id: user.id, username: user.username, email: user.email, name: user.name, role: user.role }, { message: '用户信息更新成功', status: 200 });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: '服务器内部错误', status: 500 });
    }
  }
};
module.exports = authController;