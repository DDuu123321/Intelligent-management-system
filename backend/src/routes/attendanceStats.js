// src/routes/attendanceStats.js
const express = require('express');
const router = express.Router();
const attendanceStatsController = require('../controllers/attendanceStatsController');
const { authenticateToken } = require('../middleware/auth');

// 考勤概览统计
router.get('/overview', authenticateToken, attendanceStatsController.getOverviewStats);

// 员工考勤详细统计
router.get('/employees', authenticateToken, attendanceStatsController.getEmployeeStats);

// 工地考勤统计
router.get('/worksites', authenticateToken, attendanceStatsController.getWorksiteStats);

// 考勤趋势数据 - 暂时不需要认证以便测试
router.get('/trends', attendanceStatsController.getTrendData);

// 导出考勤报表
router.get('/export', authenticateToken, attendanceStatsController.exportReport);

module.exports = router;