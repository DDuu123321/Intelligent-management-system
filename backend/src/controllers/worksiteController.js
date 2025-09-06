// src/controllers/worksiteController.js
const { Worksite, Employee, CheckIn, QRCode } = require('../models');
const { resolveError } = require('../utils/errorCodes');
const { Op } = require('sequelize');

function sendError(res, code, overrideMessage, details) {
  const { status, message, payload } = resolveError(code, overrideMessage, details);
  return res.standard(payload, { message, status });
}

// 获取所有工地
const getAllWorksites = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, state, search } = req.query;
    const pageNum = parseInt(page); const perPage = parseInt(limit); const offset = (pageNum - 1) * perPage;
    const whereClause = {};
    if (status) whereClause.status = status;
    if (state) whereClause.state = state;
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { worksite_id: { [Op.like]: `%${search}%` } },
        { street_address: { [Op.like]: `%${search}%` } },
        { suburb: { [Op.like]: `%${search}%` } }
      ];
    }
    const worksites = await Worksite.findAndCountAll({
      where: whereClause,
      include: [ { model: Employee, through: { attributes: [] }, attributes: ['employee_id', 'first_name', 'last_name'] } ],
      limit: perPage,
      offset,
      order: [['created_at', 'DESC']]
    });
    return res.standard({ worksites: worksites.rows, pagination: { current_page: pageNum, per_page: perPage, total: worksites.count, total_pages: Math.ceil(worksites.count / perPage) } }, { message: '获取工地列表成功' });
  } catch (err) {
    console.error('Get worksites error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取工地列表失败', err.message);
  }
};

// 根据ID获取工地详情
const getWorksiteById = async (req, res) => {
  try {
    const { id } = req.params;
    const worksite = await Worksite.findOne({ where: { worksite_id: id }, include: [ { model: Employee, through: { attributes: [] }, attributes: ['employee_id', 'first_name', 'last_name', 'position', 'status'] }, { model: QRCode, attributes: ['id', 'qr_token', 'qr_url', 'is_active', 'expires_at'] } ] });
    if (!worksite) return sendError(res, 'NOT_FOUND', '工地未找到');

    const recentCheckins = await CheckIn.findAll({ where: { worksite_id: id }, include: [ { model: Employee, attributes: ['employee_id', 'first_name', 'last_name'] } ], limit: 10, order: [['checkin_time', 'DESC']] });
    return res.standard({ ...worksite.toJSON(), recentCheckins }, { message: '获取工地详情成功' });
  } catch (err) {
    console.error('Get worksite by id error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取工地详情失败', err.message);
  }
};

// 创建新工地
const createWorksite = async (req, res) => {
  try {
    const worksiteData = req.body;
    const requiredFields = ['worksite_id', 'name', 'center_latitude', 'center_longitude', 'street_address', 'suburb', 'state', 'postcode', 'start_date'];
    for (const field of requiredFields) if (!worksiteData[field]) return sendError(res, 'VALIDATION_ERROR', `缺少必填字段: ${field}`, { field });

    const existingWorksite = await Worksite.findOne({ where: { worksite_id: worksiteData.worksite_id } });
    if (existingWorksite) return sendError(res, 'CONFLICT', '工地ID已存在');

    const worksite = await Worksite.create(worksiteData);
    return res.standard(worksite, { message: '工地创建成功', status: 201 });
  } catch (err) {
    console.error('Create worksite error:', err);
    if (err.name === 'SequelizeValidationError') return sendError(res, 'VALIDATION_ERROR', '创建工地失败', err.errors.map(e => ({ field: e.path, message: e.message })));
    return sendError(res, 'INTERNAL_ERROR', '创建工地失败', err.message);
  }
};

// 更新工地信息
const updateWorksite = async (req, res) => {
  try {
    const { id } = req.params; const updateData = req.body;
    const worksite = await Worksite.findOne({ where: { worksite_id: id } });
    if (!worksite) return sendError(res, 'NOT_FOUND', '工地未找到');
    await worksite.update(updateData);
    const updatedWorksite = await Worksite.findOne({ where: { worksite_id: id }, include: [ { model: Employee, through: { attributes: [] }, attributes: ['employee_id', 'first_name', 'last_name', 'position'] } ] });
    return res.standard(updatedWorksite, { message: '工地信息更新成功' });
  } catch (err) {
    console.error('Update worksite error:', err);
    if (err.name === 'SequelizeValidationError') return sendError(res, 'VALIDATION_ERROR', '更新工地信息失败', err.errors.map(e => ({ field: e.path, message: e.message })));
    return sendError(res, 'INTERNAL_ERROR', '更新工地信息失败', err.message);
  }
};

// 删除工地（软删除）
const deleteWorksite = async (req, res) => {
  try {
    const { id } = req.params; const worksite = await Worksite.findOne({ where: { worksite_id: id } });
    if (!worksite) return sendError(res, 'NOT_FOUND', '工地未找到');
    await worksite.destroy();
    return res.standard(null, { message: '工地删除成功' });
  } catch (err) {
    console.error('Delete worksite error:', err);
    return sendError(res, 'INTERNAL_ERROR', '删除工地失败', err.message);
  }
};

// 为工地分配员工
const assignEmployees = async (req, res) => {
  try {
    const { id } = req.params; const { employee_ids } = req.body;
    const worksite = await Worksite.findOne({ where: { worksite_id: id } });
    if (!worksite) return sendError(res, 'NOT_FOUND', '工地未找到');
    const employees = await Employee.findAll({ where: { employee_id: employee_ids } });
    if (employees.length !== employee_ids.length) return sendError(res, 'VALIDATION_ERROR', '部分员工ID无效');
    await worksite.setEmployees(employees);
    await worksite.update({ total_employees: employees.length, active_employees: employees.filter(emp => emp.status === 'active').length });
    return res.standard(null, { message: '员工分配成功' });
  } catch (err) {
    console.error('Assign employees error:', err);
    return sendError(res, 'INTERNAL_ERROR', '分配员工失败', err.message);
  }
};

// 获取工地统计信息
const getWorksiteStats = async (req, res) => {
  try {
    const totalWorksites = await Worksite.count();
    const activeWorksites = await Worksite.count({ where: { status: 'active' } });
    const completedWorksites = await Worksite.count({ where: { status: 'completed' } });
    const stateStats = await Worksite.findAll({ attributes: ['state', [Worksite.sequelize.fn('COUNT', Worksite.sequelize.col('id')), 'count']], group: ['state'], raw: true });
    const todayStart = new Date(); todayStart.setHours(0,0,0,0); const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const todayCheckins = await CheckIn.count({ where: { checkin_time: { [Op.between]: [todayStart, todayEnd] } } });
    return res.standard({ total: totalWorksites, active: activeWorksites, completed: completedWorksites, byState: stateStats, todayCheckins }, { message: '获取工地统计成功' });
  } catch (err) {
    console.error('Get worksite stats error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取工地统计失败', err.message);
  }
};

module.exports = { getAllWorksites, getWorksiteById, createWorksite, updateWorksite, deleteWorksite, assignEmployees, getWorksiteStats };
