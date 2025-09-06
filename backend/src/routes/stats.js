// src/routes/stats.js
const express = require('express');
const { User, Vehicle, Camera, Attendance } = require('../models');
const { Op } = require('sequelize');
const { resolveError } = require('../utils/errorCodes');
const router = express.Router();

// 获取考勤统计
router.get('/attendance', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 模拟考勤统计数据
    const stats = {
      present: await User.count() || 180,
      late: 5,
      absent: 3,
      leave: 12
    };

    console.log('考勤统计:', stats);

    return res.standard(stats, { message: '获取考勤统计成功' });
  } catch (error) {
    console.error('获取考勤统计错误:', error);
    const { status, message, payload } = resolveError('INTERNAL_ERROR');
    return res.standard(payload, { message, status });
  }
});

// 获取车辆统计
router.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll();
    
    const stats = {
      running: vehicles.filter(v => v.status === 'running').length,
      idle: vehicles.filter(v => v.status === 'idle').length,
      maintenance: vehicles.filter(v => v.status === 'maintenance').length,
      offline: vehicles.filter(v => v.status === 'offline').length
    };

    console.log('车辆统计:', stats);

    return res.standard(stats, { message: '获取车辆统计成功' });
  } catch (error) {
    console.error('获取车辆统计错误:', error);
    const { status, message, payload } = resolveError('INTERNAL_ERROR');
    return res.standard(payload, { message, status });
  }
});

// 获取监控统计
router.get('/monitoring', async (req, res) => {
  try {
    const cameras = await Camera.findAll();
    
    const stats = {
      online: cameras.filter(c => c.status === 'online').length,
      recording: cameras.filter(c => c.is_recording).length,
      alert: 3, // 模拟报警数量
      offline: cameras.filter(c => c.status === 'offline').length
    };

    console.log('监控统计:', stats);

    return res.standard(stats, { message: '获取监控统计成功' });
  } catch (error) {
    console.error('获取监控统计错误:', error);
    const { status, message, payload } = resolveError('INTERNAL_ERROR');
    return res.standard(payload, { message, status });
  }
});

// 获取车辆列表
router.get('/vehicles/list', async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      include: [{
        model: User,
        attributes: ['id', 'name', 'phone'],
        required: false
      }],
      order: [['updated_at', 'DESC']]
    });

    console.log(`返回 ${vehicles.length} 辆车的数据`);

    return res.standard(vehicles, { message: '获取车辆列表成功' });
  } catch (error) {
    console.error('获取车辆列表错误:', error);
    const { status, message, payload } = resolveError('INTERNAL_ERROR');
    return res.standard(payload, { message, status });
  }
});

// 获取摄像头列表
router.get('/cameras/list', async (req, res) => {
  try {
    const cameras = await Camera.findAll({
      order: [['area', 'ASC'], ['name', 'ASC']]
    });

    // 按区域分组
    const groupedCameras = cameras.reduce((acc, camera) => {
      if (!acc[camera.area]) {
        acc[camera.area] = [];
      }
      acc[camera.area].push(camera);
      return acc;
    }, {});

    console.log(`返回 ${cameras.length} 个摄像头的数据`);

    return res.standard(groupedCameras, { message: '获取摄像头列表成功' });
  } catch (error) {
    console.error('获取摄像头列表错误:', error);
    const { status, message, payload } = resolveError('INTERNAL_ERROR');
    return res.standard(payload, { message, status });
  }
});

module.exports = router;