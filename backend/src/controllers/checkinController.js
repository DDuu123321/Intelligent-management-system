// src/controllers/checkinController.js
const { CheckIn, Employee, Worksite } = require('../models');
const { resolveError } = require('../utils/errorCodes');
const { Op } = require('sequelize');

function sendError(res, code, overrideMessage, details) {
  const { status, message, payload } = resolveError(code, overrideMessage, details);
  return res.standard(payload, { message, status });
}

// 创建签到记录 (升级: 引入地理/顺序/可疑标记等高级逻辑)
const createCheckin = async (req, res) => {
  try {
    const {
      employee_id,
      checkin_type,
      latitude,
      longitude,
      location_accuracy,
      address,
      worksite_id,
      photo_url,
      device_id,
      device_type,
      app_version,
      weather_condition,
      temperature,
      ppe_compliance,
      safety_briefing_acknowledged
    } = req.body;

    // 必填字段
    if (!employee_id || !checkin_type || !latitude || !longitude || !worksite_id) {
      return sendError(res, 'VALIDATION_ERROR', '缺少必填字段', { fields: ['employee_id','checkin_type','latitude','longitude','worksite_id'] });
    }

    const employee = await Employee.findOne({ where: { employee_id, status: 'active', can_checkin: true } });
    if (!employee) return sendError(res, 'NOT_FOUND', '员工不存在或不可签到');

    // White Card 过期
    const today = new Date();
    if (employee.white_card_expiry && employee.white_card_expiry < today) {
      return sendError(res, 'VALIDATION_ERROR', 'White Card 已过期');
    }
    if (employee.safety_induction_completed === false) {
      return sendError(res, 'VALIDATION_ERROR', '尚未完成安全培训');
    }

    const worksite = await Worksite.findOne({ where: { worksite_id } });
    if (!worksite) return sendError(res, 'NOT_FOUND', '工地未找到');

    // 距离计算
    const distance = calculateDistance(parseFloat(latitude), parseFloat(longitude), parseFloat(worksite.center_latitude), parseFloat(worksite.center_longitude));
    const isWithinRange = distance <= worksite.radius;

    const suspicious_reasons = [];
    if (location_accuracy && worksite.max_gps_accuracy && location_accuracy > worksite.max_gps_accuracy) {
      suspicious_reasons.push('GPS accuracy too low');
    }
    if (!isWithinRange && !worksite.allow_remote_checkin) {
      return sendError(res, 'VALIDATION_ERROR', `当前位置距工地 ${Math.round(distance)}m, 无法签到`);
    }
    if (!isWithinRange && worksite.allow_remote_checkin) {
      suspicious_reasons.push('Outside worksite radius');
    }

    const now = new Date();
    if (checkin_type === 'in' && worksite.standard_work_start) {
      const workStartTime = new Date(now.toDateString() + ' ' + worksite.standard_work_start);
      if (worksite.early_checkin_buffer && now < workStartTime.getTime() - worksite.early_checkin_buffer * 60000) {
        suspicious_reasons.push('Too early for check-in');
      }
      if (worksite.late_checkin_tolerance && now > workStartTime.getTime() + worksite.late_checkin_tolerance * 60000) {
        suspicious_reasons.push('Late check-in');
      }
    }

    // 重复/顺序校验
    const todayStart = new Date(now.toDateString());
    const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);

    const duplicate = await CheckIn.findOne({ where: { employee_id, checkin_type, checkin_time: { [Op.between]: [todayStart, todayEnd] } } });
    if (duplicate) return sendError(res, 'DUPLICATE', `今天已 ${checkin_type} 过`);

    if (checkin_type === 'out') {
      const hasIn = await CheckIn.findOne({ where: { employee_id, checkin_type: 'in', checkin_time: { [Op.between]: [todayStart, todayEnd] } } });
      if (!hasIn) return sendError(res, 'INVALID_SEQUENCE', '未签到上班, 不能签退');
    }

    const checkinPayload = {
      employee_id,
      checkin_type,
      checkin_time: now,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      location_accuracy: location_accuracy ? parseFloat(location_accuracy) : null,
      address,
      worksite_id,
      is_within_worksite: isWithinRange,
      distance_from_worksite: distance,
      photo_url: photo_url || null,
      device_id,
      device_type,
      app_version,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      weather_condition,
      temperature: temperature ? parseFloat(temperature) : null,
      status: suspicious_reasons.length ? 'flagged' : 'approved',
      is_suspicious: suspicious_reasons.length > 0,
      suspicious_reasons: suspicious_reasons.length ? suspicious_reasons : null,
      ppe_compliance: ppe_compliance !== false,
      safety_briefing_acknowledged: safety_briefing_acknowledged === true
    };

    const created = await CheckIn.create(checkinPayload);

    return res.standard({
      checkin: created,
      validation: {
        is_within_worksite: isWithinRange,
        distance_from_worksite: Math.round(distance),
        worksite_name: worksite.name,
        is_suspicious: suspicious_reasons.length > 0,
        suspicious_reasons
      }
    }, { message: suspicious_reasons.length ? '签到成功但被标记' : '签到成功', status: 201 });
  } catch (err) {
    console.error('Create checkin error:', err);
    return sendError(res, 'INTERNAL_ERROR', '签到失败', err.message);
  }
};

// 获取签到记录列表
const getCheckins = async (req, res) => {
  try {
    const { page = 1, limit = 20, employee_id, worksite_id, checkin_type, status, start_date, end_date } = req.query;
    const pageNum = parseInt(page); const perPage = parseInt(limit); const offset = (pageNum - 1) * perPage;
    const whereClause = {};
    if (employee_id) whereClause.employee_id = employee_id;
    if (worksite_id) whereClause.worksite_id = worksite_id;
    if (checkin_type) whereClause.checkin_type = checkin_type;
    if (status) whereClause.status = status;
    if (start_date && end_date) whereClause.checkin_time = { [Op.between]: [new Date(start_date), new Date(end_date)] };

    const checkins = await CheckIn.findAndCountAll({
      where: whereClause,
      include: [
        { model: Employee, attributes: ['employee_id', 'first_name', 'last_name', 'position'] },
        { model: Worksite, attributes: ['worksite_id', 'name', 'street_address'] }
      ],
      limit: perPage,
      offset,
      order: [['checkin_time', 'DESC']]
    });

    return res.standard({
      checkins: checkins.rows,
      pagination: {
        current_page: pageNum,
        per_page: perPage,
        total: checkins.count,
        total_pages: Math.ceil(checkins.count / perPage)
      }
    }, { message: '获取签到记录成功' });
  } catch (err) {
    console.error('Get checkins error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取签到记录失败', err.message);
  }
};

// 根据ID获取签到详情
const getCheckinById = async (req, res) => {
  try {
    const { id } = req.params;
    const checkin = await CheckIn.findByPk(id, { include: [ { model: Employee, attributes: ['employee_id', 'first_name', 'last_name', 'position', 'department'] }, { model: Worksite, attributes: ['worksite_id', 'name', 'street_address', 'center_latitude', 'center_longitude', 'radius'] } ] });
    if (!checkin) return sendError(res, 'NOT_FOUND', '签到记录未找到');
    return res.standard(checkin, { message: '获取签到详情成功' });
  } catch (err) {
    console.error('Get checkin by id error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取签到详情失败', err.message);
  }
};

// 更新签到状态
const updateCheckinStatus = async (req, res) => {
  try {
    const { id } = req.params; const { status, admin_notes } = req.body;
    const checkin = await CheckIn.findByPk(id);
    if (!checkin) return sendError(res, 'NOT_FOUND', '签到记录未找到');
    await checkin.update({ status, admin_notes: admin_notes || checkin.admin_notes, updated_by: req.user?.employee_id || 'admin' });
    return res.standard(checkin, { message: '签到状态更新成功' });
  } catch (err) {
    console.error('Update checkin status error:', err);
    return sendError(res, 'INTERNAL_ERROR', '更新签到状态失败', err.message);
  }
};

// 获取签到统计信息
const getCheckinStats = async (req, res) => {
  try {
    const { start_date, end_date, worksite_id } = req.query;
    const whereClause = {};
    if (start_date && end_date) whereClause.checkin_time = { [Op.between]: [new Date(start_date), new Date(end_date)] };
    if (worksite_id) whereClause.worksite_id = worksite_id;

    const totalCheckins = await CheckIn.count({ where: whereClause });
    const approvedCheckins = await CheckIn.count({ where: { ...whereClause, status: 'approved' } });
    const pendingCheckins = await CheckIn.count({ where: { ...whereClause, status: 'pending' } });
    const rejectedCheckins = await CheckIn.count({ where: { ...whereClause, status: 'rejected' } });

    const typeStats = await CheckIn.findAll({
      where: whereClause,
      attributes: ['checkin_type', [CheckIn.sequelize.fn('COUNT', CheckIn.sequelize.col('id')), 'count']],
      group: ['checkin_type'],
      raw: true
    });

    const worksiteStats = await CheckIn.findAll({
      where: whereClause,
      attributes: ['worksite_id', [CheckIn.sequelize.fn('COUNT', CheckIn.sequelize.col('id')), 'count']],
      include: [{ model: Worksite, attributes: ['name'] }],
      group: ['worksite_id'],
      raw: true
    });

    return res.standard({
      total: totalCheckins,
      approved: approvedCheckins,
      pending: pendingCheckins,
      rejected: rejectedCheckins,
      byType: typeStats,
      byWorksite: worksiteStats
    }, { message: '获取签到统计成功' });
  } catch (err) {
    console.error('Get checkin stats error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取签到统计失败', err.message);
  }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 专门为前端优化的签到记录查询接口
const getCheckinRecords = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      employee_id, 
      worksite_id, 
      checkin_type, 
      status, 
      start_date, 
      end_date,
      search 
    } = req.query;
    
    const pageNum = parseInt(page);
    const perPage = parseInt(limit);
    const offset = (pageNum - 1) * perPage;
    
    const whereClause = {};
    
    // 基本筛选条件
    if (employee_id) whereClause.employee_id = employee_id;
    if (worksite_id) whereClause.worksite_id = worksite_id;
    if (checkin_type) whereClause.checkin_type = checkin_type;
    if (status) whereClause.status = status;
    
    // 日期范围筛选
    if (start_date && end_date) {
      whereClause.checkin_time = { 
        [Op.between]: [new Date(start_date), new Date(end_date + ' 23:59:59')] 
      };
    }
    
    // 搜索条件 (员工姓名、电话号码)
    const includeClause = [
      { 
        model: Employee, 
        attributes: ['employee_id', 'first_name', 'last_name', 'phone'], 
        where: search ? {
          [Op.or]: [
            { first_name: { [Op.like]: `%${search}%` } },
            { last_name: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } }
          ]
        } : undefined
      },
      { 
        model: Worksite, 
        attributes: ['worksite_id', 'name', 'street_address'] 
      }
    ];

    const { rows: checkins, count: total } = await CheckIn.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: perPage,
      offset,
      order: [['checkin_time', 'DESC']]
    });

    // 格式化数据为前端需要的格式
    const records = checkins.map(checkin => {
      const employee = checkin.Employee;
      const worksite = checkin.Worksite;
      
      return {
        id: checkin.id,
        employee_id: checkin.employee_id,
        employee_name: employee ? `${employee.first_name} ${employee.last_name}` : '未知员工',
        phone_number: employee ? employee.phone : '',
        qr_code_id: checkin.qr_code_id || '',
        worksite_name: worksite ? worksite.name : '未知工地',
        checkin_type: checkin.checkin_type,
        checkin_time: checkin.checkin_time,
        latitude: checkin.latitude,
        longitude: checkin.longitude,
        location_accuracy: checkin.location_accuracy,
        address: checkin.address,
        photo_data: checkin.photo_url, // 假设前端需要 photo_data 字段
        device_info: {
          device_id: checkin.device_id,
          device_type: checkin.device_type,
          app_version: checkin.app_version
        },
        status: checkin.status === 'approved' ? 'success' : (checkin.status === 'rejected' ? 'failed' : checkin.status),
        created_at: checkin.created_at,
        updated_at: checkin.updated_at
      };
    });

    const totalPages = Math.ceil(total / perPage);

    return res.standard({
      records,
      total,
      page: pageNum,
      limit: perPage,
      totalPages
    }, { message: '获取签到记录成功' });
    
  } catch (err) {
    console.error('Get checkin records error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取签到记录失败', err.message);
  }
};

// 导出签到记录
const exportCheckinRecords = async (req, res) => {
  try {
    const { 
      employee_id, 
      worksite_id, 
      checkin_type, 
      status, 
      start_date, 
      end_date,
      search 
    } = req.query;
    
    const whereClause = {};
    
    // 基本筛选条件
    if (employee_id) whereClause.employee_id = employee_id;
    if (worksite_id) whereClause.worksite_id = worksite_id;
    if (checkin_type) whereClause.checkin_type = checkin_type;
    if (status) whereClause.status = status;
    
    // 日期范围筛选
    if (start_date && end_date) {
      whereClause.checkin_time = { 
        [Op.between]: [new Date(start_date), new Date(end_date + ' 23:59:59')] 
      };
    }
    
    // 搜索条件
    const includeClause = [
      { 
        model: Employee, 
        attributes: ['employee_id', 'first_name', 'last_name', 'phone'], 
        where: search ? {
          [Op.or]: [
            { first_name: { [Op.like]: `%${search}%` } },
            { last_name: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } }
          ]
        } : undefined
      },
      { 
        model: Worksite, 
        attributes: ['worksite_id', 'name', 'street_address'] 
      }
    ];

    const checkins = await CheckIn.findAll({
      where: whereClause,
      include: includeClause,
      order: [['checkin_time', 'DESC']]
    });

    // 生成CSV内容
    const csvHeader = [
      '员工ID', '员工姓名', '电话号码', '工地名称', '签到类型', 
      '签到时间', '位置地址', '经度', '纬度', '状态', '设备ID'
    ].join(',') + '\n';
    
    const csvContent = checkins.map(checkin => {
      const employee = checkin.Employee;
      const worksite = checkin.Worksite;
      
      return [
        checkin.employee_id,
        employee ? `${employee.first_name} ${employee.last_name}` : '未知员工',
        employee ? employee.phone : '',
        worksite ? worksite.name : '未知工地',
        checkin.checkin_type === 'in' ? '签到' : '签退',
        checkin.checkin_time ? new Date(checkin.checkin_time).toLocaleString('zh-CN') : '',
        checkin.address || '',
        checkin.longitude || '',
        checkin.latitude || '',
        checkin.status === 'approved' ? '成功' : (checkin.status === 'rejected' ? '失败' : checkin.status),
        checkin.device_id || ''
      ].map(field => `"${field}"`).join(',');
    }).join('\n');

    const csv = csvHeader + csvContent;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="checkin_records_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('\uFEFF' + csv); // 添加BOM以支持中文
    
  } catch (err) {
    console.error('Export checkin records error:', err);
    return sendError(res, 'INTERNAL_ERROR', '导出签到记录失败', err.message);
  }
};

module.exports = { 
  createCheckin, 
  getCheckins, 
  getCheckinById, 
  updateCheckinStatus, 
  getCheckinStats, 
  getCheckinRecords, 
  exportCheckinRecords 
};
