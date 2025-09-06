// src/routes/public.js - 公开访问的路由（不需要认证）
const express = require('express');
const { createEmployeeCheckin, getEmployeeData, getWorksiteInfo } = require('../controllers/publicController');
const router = express.Router();

// 员工签到（公开）
router.post('/employee-checkin', createEmployeeCheckin);

// 获取员工信息（用于签到页面显示，公开）
router.get('/employee/:employee_id', getEmployeeData);

// 获取工地信息（用于签到页面显示，公开）
router.get('/worksite/:worksite_id', getWorksiteInfo);

module.exports = router;
