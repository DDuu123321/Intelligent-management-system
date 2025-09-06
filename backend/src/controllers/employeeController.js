// src/controllers/employeeController.js
const { Employee, User, EmployeeLicense, LicenseType, Worksite } = require('../models');
const { resolveError } = require('../utils/errorCodes');
const { Op } = require('sequelize');

// 统一错误响应辅助
function sendError(res, code, overrideMessage, details) {
  const { status, message, payload } = resolveError(code, overrideMessage, details);
  return res.standard(payload, { message, status });
}

// 获取所有员工
const getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, department, search } = req.query;
    const pageNum = parseInt(page);
    const perPage = parseInt(limit);
    const offset = (pageNum - 1) * perPage;

    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (department) {
      whereClause.department = department;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { employee_id: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const employees = await Employee.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['username', 'role', 'last_login']
        },
        {
          model: EmployeeLicense,
          include: [LicenseType]
        }
      ],
      limit: perPage,
      offset,
      order: [['created_at', 'DESC']]
    });

    return res.standard({
      employees: employees.rows,
      pagination: {
        current_page: pageNum,
        per_page: perPage,
        total: employees.count,
        total_pages: Math.ceil(employees.count / perPage)
      }
    }, { message: '获取员工列表成功' });
  } catch (err) {
    console.error('Get employees error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取员工列表失败', err.message);
  }
};

// 根据ID获取员工详情
const getEmployeeById = async (req, res) => {
  try {
    const id = req.params.id || req.params.employee_id; // 兼容路由命名
    const employee = await Employee.findOne({
      where: { employee_id: id },
      include: [
        {
          model: User,
          attributes: ['username', 'role', 'last_login', 'status']
        },
        {
          model: EmployeeLicense,
          include: [LicenseType]
        },
        {
          model: Worksite,
          through: { attributes: [] }
        }
      ]
    });

    if (!employee) {
      return sendError(res, 'NOT_FOUND', '员工未找到');
    }

    return res.standard(employee, { message: '获取员工详情成功' });
  } catch (err) {
    console.error('Get employee by id error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取员工详情失败', err.message);
  }
};

// 创建新员工
const createEmployee = async (req, res) => {
  try {
    const employeeData = req.body;
    
    // 验证必填字段
    const requiredFields = [
      'employee_id', 'first_name', 'last_name', 'phone', 'date_of_birth',
      'white_card_number', 'white_card_expiry', 'position', 'department',
      'hourly_rate', 'start_date', 'emergency_contact_name', 
      'emergency_contact_phone', 'emergency_contact_relationship'
    ];
    
    for (const field of requiredFields) {
      if (!employeeData[field]) {
        return sendError(res, 'VALIDATION_ERROR', `缺少必填字段: ${field}`, { field });
      }
    }

    // 检查员工ID是否已存在
    const existingEmployee = await Employee.findOne({
      where: { employee_id: employeeData.employee_id }
    });
    
    if (existingEmployee) {
      return sendError(res, 'CONFLICT', '员工ID已存在');
    }

    // 创建员工记录（不创建用户账号，员工只需要签到，不需要登录）
    const employee = await Employee.create(employeeData);

    // 处理工地关联
    if (Array.isArray(employeeData.worksite_ids) && employeeData.worksite_ids.length) {
      const worksites = await Worksite.findAll({ where: { worksite_id: employeeData.worksite_ids } });
      await employee.setWorksites(worksites);
    }

    return res.standard(employee, { message: '员工创建成功', status: 201 });
  } catch (err) {
    console.error('Create employee error:', err);
    if (err.name === 'SequelizeValidationError') {
      return sendError(res, 'VALIDATION_ERROR', '创建员工失败', err.errors.map(e => ({ field: e.path, message: e.message })));
    }
    return sendError(res, 'INTERNAL_ERROR', '创建员工失败', err.message);
  }
};

// 更新员工信息
const updateEmployee = async (req, res) => {
  try {
    const id = req.params.id || req.params.employee_id;
    const updateData = req.body;
    
    const employee = await Employee.findOne({
      where: { employee_id: id }
    });

    if (!employee) {
      return sendError(res, 'NOT_FOUND', '员工未找到');
    }

    // 更新员工信息
    await employee.update(updateData);

    // 更新工地关联
    if (updateData.worksite_ids) {
      const worksites = await Worksite.findAll({ where: { worksite_id: updateData.worksite_ids || [] } });
      await employee.setWorksites(worksites);
    }

    // 获取更新后的员工信息
    const updatedEmployee = await Employee.findOne({
      where: { employee_id: id },
      include: [
        {
          model: User,
          attributes: ['username', 'role', 'last_login', 'status']
        },
        {
          model: EmployeeLicense,
          include: [LicenseType]
        },
        {
          model: Worksite,
          through: { attributes: [] }
        }
      ]
    });

    return res.standard(updatedEmployee, { message: '员工信息更新成功' });
  } catch (err) {
    console.error('Update employee error:', err);
    if (err.name === 'SequelizeValidationError') {
      return sendError(res, 'VALIDATION_ERROR', '更新员工信息失败', err.errors.map(e => ({ field: e.path, message: e.message })));
    }
    return sendError(res, 'INTERNAL_ERROR', '更新员工信息失败', err.message);
  }
};

// 删除员工（软删除）
const deleteEmployee = async (req, res) => {
  try {
    const id = req.params.id || req.params.employee_id;
    
    const employee = await Employee.findOne({
      where: { employee_id: id }
    });

    if (!employee) {
      return sendError(res, 'NOT_FOUND', '员工未找到');
    }

    // 软删除员工
    await employee.destroy();

    return res.standard(null, { message: '员工删除成功' });
  } catch (err) {
    console.error('Delete employee error:', err);
    return sendError(res, 'INTERNAL_ERROR', '删除员工失败', err.message);
  }
};

// 获取员工统计信息
const getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.count();
    const activeEmployees = await Employee.count({ where: { status: 'active' } });
    const inactiveEmployees = await Employee.count({ where: { status: 'inactive' } });
    
    // 按部门统计
    const departmentStats = await Employee.findAll({
      attributes: [
        'department',
        [Employee.sequelize.fn('COUNT', Employee.sequelize.col('id')), 'count']
      ],
      group: ['department'],
      raw: true
    });

    // 按职位统计
    const positionStats = await Employee.findAll({
      attributes: [
        'position',
        [Employee.sequelize.fn('COUNT', Employee.sequelize.col('id')), 'count']
      ],
      group: ['position'],
      raw: true
    });

    return res.standard({
      total: totalEmployees,
      active: activeEmployees,
      inactive: inactiveEmployees,
      byDepartment: departmentStats,
      byPosition: positionStats
    }, { message: '获取员工统计成功' });
  } catch (err) {
    console.error('Get employee stats error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取员工统计失败', err.message);
  }
};

// 获取部门列表
const getDepartments = async (req, res) => {
  try {
    const departments = await Employee.findAll({ attributes: ['department'], group: ['department'], where: { status: 'active' } });
    const list = departments.map(d => d.department);
    return res.standard(list, { message: '获取部门列表成功' });
  } catch (err) {
    console.error('Get departments error:', err);
    return sendError(res, 'INTERNAL_ERROR', '获取部门列表失败', err.message);
  }
};

// 批量导入
const batchImportEmployees = async (req, res) => {
  try {
    const { employees } = req.body;
    if (!Array.isArray(employees) || !employees.length) {
      return sendError(res, 'VALIDATION_ERROR', '员工数据无效');
    }
    const results = { success: 0, failed: 0, errors: [] };
    for (const data of employees) {
      try {
        if (!data.employee_id || !data.first_name || !data.last_name) {
          results.failed++; results.errors.push({ employee_id: data.employee_id, error: '缺少必填字段' }); continue;
        }
        const exists = await Employee.findOne({ where: { employee_id: data.employee_id } });
        if (exists) { results.failed++; results.errors.push({ employee_id: data.employee_id, error: '员工ID已存在' }); continue; }
        await Employee.create(data);
        results.success++;
      } catch (e) {
        results.failed++; results.errors.push({ employee_id: data.employee_id, error: e.message });
      }
    }
    return res.standard(results, { message: '批量导入完成' });
  } catch (err) {
    console.error('Batch import employees error:', err);
    return sendError(res, 'INTERNAL_ERROR', '批量导入失败', err.message);
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  getDepartments,
  batchImportEmployees
};
