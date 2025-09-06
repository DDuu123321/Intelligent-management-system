// src/controllers/publicController.js - 公开访问的控制器（不需要认证）
const { Employee, Worksite, CheckIn, EmployeeLicense, LicenseType } = require('../models');
const { sendError } = require('../middleware/response');

// 员工签到（公开）
const createEmployeeCheckin = async (req, res) => {
  try {
    const {
      employee_id,
      worksite_id,
      checkin_type = 'in',
      gps_location,
      photo_url,
      notes
    } = req.body;

    // 验证必填字段
    if (!employee_id || !worksite_id) {
      return sendError(res, 'VALIDATION_ERROR', '员工ID和工地ID是必填的');
    }

    // 验证员工是否存在且处于活跃状态
    const employee = await Employee.findOne({
      where: { 
        employee_id: employee_id,
        status: 'active',
        can_checkin: true
      }
    });

    if (!employee) {
      return sendError(res, 'NOT_FOUND', '员工不存在或无签到权限');
    }

    // 验证工地是否存在且处于活跃状态
    const worksite = await Worksite.findOne({
      where: { 
        worksite_id: worksite_id,
        status: 'active'
      }
    });

    if (!worksite) {
      return sendError(res, 'NOT_FOUND', '工地不存在或未激活');
    }

    // 检查是否重复签到（同一天同一类型）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const existingCheckin = await CheckIn.findOne({
      where: {
        employee_id: employee_id,
        worksite_id: worksite_id,
        checkin_type: checkin_type,
        checkin_time: {
          [require('sequelize').Op.gte]: today,
          [require('sequelize').Op.lt]: tomorrow
        }
      }
    });

    if (existingCheckin) {
      return sendError(res, 'CONFLICT', `今日已经${checkin_type === 'in' ? '签到' : '签退'}`);
    }

    // 创建签到记录
    const checkinData = {
      employee_id: employee_id,
      worksite_id: worksite_id,
      checkin_type: checkin_type,
      checkin_time: new Date(),
      gps_location: gps_location,
      photo_url: photo_url,
      notes: notes,
      status: 'approved', // 员工签到自动批准
      is_suspicious: false
    };

    const checkin = await CheckIn.create(checkinData);

    return res.standard(checkin, { 
      message: `${checkin_type === 'in' ? '签到' : '签退'}成功`,
      status: 201 
    });

  } catch (err) {
    console.error('Employee checkin error:', err);
    return sendError(res, 'INTERNAL_ERROR', '签到失败', err.message);
  }
};

// 获取员工信息（用于签到页面显示）
const getEmployeeData = async (req, res) => {
  try {
    const { employee_id } = req.params;

    const employee = await Employee.findOne({
      where: { 
        employee_id: employee_id,
        status: 'active'
      },
      attributes: [
        'employee_id', 'first_name', 'last_name', 'position', 
        'department', 'profile_photo', 'can_checkin'
      ],
      include: [
        {
          model: EmployeeLicense,
          include: [LicenseType],
          where: { 
            expiry_date: { 
              [require('sequelize').Op.gte]: new Date() 
            } 
          },
          required: false
        }
      ]
    });

    if (!employee) {
      return sendError(res, 'NOT_FOUND', '员工不存在');
    }

    if (!employee.can_checkin) {
      return sendError(res, 'FORBIDDEN', '员工无签到权限');
    }

    return res.standard(employee, { message: '获取员工信息成功' });

  } catch (err) {
    console.error('Get employee data error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取员工信息失败', err.message);
  }
};

// 获取工地信息（用于签到页面显示）
const getWorksiteInfo = async (req, res) => {
  try {
    const { worksite_id } = req.params;

    const worksite = await Worksite.findOne({
      where: { 
        worksite_id: worksite_id,
        status: 'active'
      },
      attributes: [
        'worksite_id', 'name', 'description', 'street_address',
        'suburb', 'state', 'postcode', 'require_photo', 'require_gps',
        'standard_work_start', 'standard_work_end'
      ]
    });

    if (!worksite) {
      return sendError(res, 'NOT_FOUND', '工地不存在');
    }

    return res.standard(worksite, { message: '获取工地信息成功' });

  } catch (err) {
    console.error('Get worksite info error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取工地信息失败', err.message);
  }
};

module.exports = {
  createEmployeeCheckin,
  getEmployeeData,
  getWorksiteInfo
};
