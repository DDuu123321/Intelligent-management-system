// src/routes/worksites.js
const express = require('express');
const { Worksite, Employee, CheckIn } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 获取所有工地
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, state, search } = req.query;
    
    const where = {};
    
    // 状态筛选
    if (status) {
      where.status = status;
    }
    
    // 州筛选
    if (state) {
      where.state = state;
    }
    
    // 搜索功能
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { worksite_id: { [Op.like]: `%${search}%` } },
        { street_address: { [Op.like]: `%${search}%` } },
        { suburb: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Worksite.findAndCountAll({
      where,
      include: [
        {
          model: Employee,
          through: { attributes: [] },
          attributes: ['employee_id', 'first_name', 'last_name', 'status']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    // 计算每个工地的统计信息
    for (const worksite of rows) {
      const activeEmployees = worksite.Employees.filter(emp => emp.status === 'active').length;
      worksite.dataValues.active_employees_count = activeEmployees;
      worksite.dataValues.total_employees_count = worksite.Employees.length;
    }
    
    return res.standard({
      worksites: rows,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit)
      }
    }, { message: 'Worksites retrieved successfully' });
  } catch (error) {
    console.error('Error fetching worksites:', error);
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to fetch worksites', status: 500 });
  }
});

// 获取单个工地详情
router.get('/:worksite_id', authenticateToken, async (req, res) => {
  try {
    const { worksite_id } = req.params;
    
    const worksite = await Worksite.findOne({
      where: { worksite_id },
      include: [
        {
          model: Employee,
          through: { attributes: [] },
          attributes: ['employee_id', 'first_name', 'last_name', 'department', 'position', 'status']
        }
      ]
    });
    
    if (!worksite) {
      return res.standard({ error: { code: 'NOT_FOUND' } }, { message: 'Worksite not found', status: 404 });
    }
    
    // 获取今日签到统计
    const today_start = new Date();
    today_start.setHours(0, 0, 0, 0);
    
    const today_end = new Date();
    today_end.setHours(23, 59, 59, 999);
    
    const todayCheckins = await CheckIn.count({
      where: {
        worksite_id,
        checkin_type: 'in',
        checkin_time: {
          [require('sequelize').Op.between]: [today_start, today_end]
        }
      }
    });
    
    const suspiciousCheckins = await CheckIn.count({
      where: {
        worksite_id,
        is_suspicious: true,
        checkin_time: {
          [require('sequelize').Op.between]: [today_start, today_end]
        }
      }
    });
    
    worksite.dataValues.today_checkins = todayCheckins;
    worksite.dataValues.today_suspicious_checkins = suspiciousCheckins;
    
    return res.standard(worksite, { message: 'Worksite details retrieved successfully' });
  } catch (error) {
    console.error('Error fetching worksite:', error);
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to fetch worksite details', status: 500 });
  }
});

// 创建新工地
router.post('/', authenticateToken, async (req, res) => {
  try {
    const worksiteData = req.body;
    
    // 验证必填字段
    const requiredFields = [
      'worksite_id', 'name', 'center_latitude', 'center_longitude',
      'street_address', 'suburb', 'state', 'postcode', 'start_date'
    ];
    
    for (const field of requiredFields) {
      if (!worksiteData[field]) {
        return res.standard({ error: { code: 'VALIDATION_ERROR', field } }, { message: `Missing required field: ${field}`, status: 400 });
      }
    }
    
    // 验证坐标范围（澳大利亚范围）
    const lat = parseFloat(worksiteData.center_latitude);
    const lng = parseFloat(worksiteData.center_longitude);
    
    if (lat < -44 || lat > -10 || lng < 113 || lng > 154) {
      return res.standard({ error: { code: 'VALIDATION_ERROR' } }, { message: 'Coordinates are outside Australia', status: 400 });
    }
    
    // 检查工地ID是否已存在
    const existingWorksite = await Worksite.findOne({
      where: { worksite_id: worksiteData.worksite_id }
    });
    
    if (existingWorksite) {
      return res.standard({ error: { code: 'CONFLICT' } }, { message: 'Worksite ID already exists', status: 400 });
    }
    
    const worksite = await Worksite.create(worksiteData);
    
    return res.standard(worksite, { message: 'Worksite created successfully', status: 201 });
  } catch (error) {
    console.error('Error creating worksite:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.standard({ error: { code: 'VALIDATION_ERROR', details: error.errors[0].message } }, { message: error.errors[0].message, status: 400 });
    }
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to create worksite', status: 500 });
  }
});

// 更新工地信息
router.put('/:worksite_id', authenticateToken, async (req, res) => {
  try {
    const { worksite_id } = req.params;
    const updateData = req.body;
    
    const worksite = await Worksite.findOne({
      where: { worksite_id }
    });
    
    if (!worksite) {
      return res.standard({ error: { code: 'NOT_FOUND' } }, { message: 'Worksite not found', status: 404 });
    }
    
    // 如果更新坐标，验证范围
    if (updateData.center_latitude || updateData.center_longitude) {
      const lat = parseFloat(updateData.center_latitude || worksite.center_latitude);
      const lng = parseFloat(updateData.center_longitude || worksite.center_longitude);
      
      if (lat < -44 || lat > -10 || lng < 113 || lng > 154) {
        return res.standard({ error: { code: 'VALIDATION_ERROR' } }, { message: 'Coordinates are outside Australia', status: 400 });
      }
    }
    
    await worksite.update(updateData);
    
    return res.standard(worksite, { message: 'Worksite updated successfully' });
  } catch (error) {
    console.error('Error updating worksite:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.standard({ error: { code: 'VALIDATION_ERROR', details: error.errors[0].message } }, { message: error.errors[0].message, status: 400 });
    }
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to update worksite', status: 500 });
  }
});

// 软删除工地
router.delete('/:worksite_id', authenticateToken, async (req, res) => {
  try {
    const { worksite_id } = req.params;
    
    const worksite = await Worksite.findOne({
      where: { worksite_id }
    });
    
    if (!worksite) {
      return res.standard({ error: { code: 'NOT_FOUND' } }, { message: 'Worksite not found', status: 404 });
    }
    
    // 检查是否有活跃的员工签到记录
    const today_start = new Date();
    today_start.setHours(0, 0, 0, 0);
    
    const todayCheckins = await CheckIn.count({
      where: {
        worksite_id,
        checkin_time: {
          [require('sequelize').Op.gte]: today_start
        }
      }
    });
    
    if (todayCheckins > 0) {
      return res.standard({ error: { code: 'BLOCKED' } }, { message: 'Cannot delete worksite with active check-ins today', status: 400 });
    }
    
    await worksite.destroy();
    
    return res.standard(null, { message: 'Worksite deleted successfully' });
  } catch (error) {
    console.error('Error deleting worksite:', error);
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to delete worksite', status: 500 });
  }
});

// 为工地分配员工
router.post('/:worksite_id/employees', authenticateToken, async (req, res) => {
  try {
    const { worksite_id } = req.params;
    const { employee_ids } = req.body;
    
    if (!Array.isArray(employee_ids) || employee_ids.length === 0) {
      return res.standard({ error: { code: 'VALIDATION_ERROR' } }, { message: 'Invalid employee_ids', status: 400 });
    }
    
    const worksite = await Worksite.findOne({
      where: { worksite_id }
    });
    
    if (!worksite) {
      return res.standard({ error: { code: 'NOT_FOUND' } }, { message: 'Worksite not found', status: 404 });
    }
    
    const employees = await Employee.findAll({
      where: { 
        employee_id: employee_ids,
        status: 'active'
      }
    });
    
    if (employees.length !== employee_ids.length) {
      return res.standard({ error: { code: 'VALIDATION_ERROR' } }, { message: 'Some employees not found or inactive', status: 400 });
    }
    
    await worksite.addEmployees(employees);
    
    // 更新工地员工统计
    const totalEmployees = await worksite.countEmployees();
    const activeEmployees = await worksite.countEmployees({
      where: { status: 'active' }
    });
    
    await worksite.update({
      total_employees: totalEmployees,
      active_employees: activeEmployees
    });
    
    return res.standard({ assigned_employees: employees.length, total_employees: totalEmployees }, { message: 'Employees assigned to worksite successfully' });
  } catch (error) {
    console.error('Error assigning employees:', error);
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to assign employees to worksite', status: 500 });
  }
});

// 从工地移除员工
router.delete('/:worksite_id/employees/:employee_id', authenticateToken, async (req, res) => {
  try {
    const { worksite_id, employee_id } = req.params;
    
    const worksite = await Worksite.findOne({
      where: { worksite_id }
    });
    
    if (!worksite) {
      return res.standard({ error: { code: 'NOT_FOUND' } }, { message: 'Worksite not found', status: 404 });
    }
    
    const employee = await Employee.findOne({
      where: { employee_id }
    });
    
    if (!employee) {
      return res.standard({ error: { code: 'NOT_FOUND' } }, { message: 'Employee not found', status: 404 });
    }
    
    await worksite.removeEmployee(employee);
    
    // 更新工地员工统计
    const totalEmployees = await worksite.countEmployees();
    const activeEmployees = await worksite.countEmployees({
      where: { status: 'active' }
    });
    
    await worksite.update({
      total_employees: totalEmployees,
      active_employees: activeEmployees
    });
    
    return res.standard(null, { message: 'Employee removed from worksite successfully' });
  } catch (error) {
    console.error('Error removing employee:', error);
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to remove employee from worksite', status: 500 });
  }
});

// 获取工地签到统计
router.get('/:worksite_id/stats', authenticateToken, async (req, res) => {
  try {
    const { worksite_id } = req.params;
    const { start_date, end_date } = req.query;
    
    const worksite = await Worksite.findOne({
      where: { worksite_id }
    });
    
    if (!worksite) {
      return res.standard({ error: { code: 'NOT_FOUND' } }, { message: 'Worksite not found', status: 404 });
    }
    
    // 设置日期范围
    const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(new Date().getDate() - 7));
    const endDate = end_date ? new Date(end_date) : new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const { Op } = require('sequelize');
    
    // 签到统计
    const checkinStats = await CheckIn.findAll({
      attributes: [
        'checkin_type',
        [require('sequelize').fn('COUNT', require('sequelize').col('*')), 'count']
      ],
      where: {
        worksite_id,
        checkin_time: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: ['checkin_type']
    });
    
    // 每日签到统计
    const dailyStats = await CheckIn.findAll({
      attributes: [
        [require('sequelize').fn('DATE', require('sequelize').col('checkin_time')), 'date'],
        [require('sequelize').fn('COUNT', require('sequelize').col('*')), 'count']
      ],
      where: {
        worksite_id,
        checkin_type: 'in',
        checkin_time: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: [require('sequelize').fn('DATE', require('sequelize').col('checkin_time'))],
      order: [[require('sequelize').fn('DATE', require('sequelize').col('checkin_time')), 'ASC']]
    });
    
    // 可疑签到统计
    const suspiciousCount = await CheckIn.count({
      where: {
        worksite_id,
        is_suspicious: true,
        checkin_time: {
          [Op.between]: [startDate, endDate]
        }
      }
    });
    
    // 部门统计
    const departmentStats = await CheckIn.findAll({
      attributes: [
        [require('sequelize').col('Employee.department'), 'department'],
        [require('sequelize').fn('COUNT', require('sequelize').col('CheckIn.id')), 'count']
      ],
      include: [
        {
          model: Employee,
          attributes: []
        }
      ],
      where: {
        worksite_id,
        checkin_time: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: ['Employee.department']
    });
    
    return res.standard({
      checkin_stats: checkinStats,
      daily_stats: dailyStats,
      suspicious_count: suspiciousCount,
      department_stats: departmentStats,
      date_range: {
        start: startDate,
        end: endDate
      }
    }, { message: 'Worksite statistics retrieved successfully' });
  } catch (error) {
    console.error('Error fetching worksite stats:', error);
    return res.standard({ error: { code: 'INTERNAL_ERROR' } }, { message: 'Failed to fetch worksite statistics', status: 500 });
  }
});

module.exports = router;