// src/routes/checkins.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createCheckin, getCheckins, getCheckinById, updateCheckinStatus, getCheckinStats, getCheckinRecords, exportCheckinRecords } = require('../controllers/checkinController');
const router = express.Router();

// 创建签到
router.post('/', authenticateToken, createCheckin);
// 分页列表
router.get('/', authenticateToken, getCheckins);
// 签到记录查看 (为前端专门优化的接口)
router.get('/records', authenticateToken, getCheckinRecords);
// 导出签到记录
router.get('/records/export', authenticateToken, exportCheckinRecords);
// 统计
router.get('/stats', authenticateToken, getCheckinStats);
// 详情
router.get('/:id', authenticateToken, getCheckinById);
// 根据记录ID获取详情 (为前端专门优化的接口)
router.get('/records/:id', authenticateToken, getCheckinById);
// 审核 / 更新状态
router.put('/:id/review', authenticateToken, updateCheckinStatus);

module.exports = router;