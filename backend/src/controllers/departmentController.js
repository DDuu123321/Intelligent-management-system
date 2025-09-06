// src/controllers/departmentController.js
console.log('🔧 Loading department controller...');
try {
  const models = require('../models');
  console.log('🔧 Models available:', Object.keys(models));
  var Department = models.Department;
  var Employee = models.Employee;
  console.log('🔧 Department model:', !!Department, 'Employee model:', !!Employee);
} catch (error) {
  console.error('🔧 Error loading models:', error.message);
}
const { resolveError } = require('../utils/errorCodes');
const { Op } = require('sequelize');

function sendError(res, code, overrideMessage, details) {
  const { status, message, payload } = resolveError(code, overrideMessage, details);
  return res.standard(payload, { message, status });
}

// 获取所有部门列表
const getDepartments = async (req, res) => {
  try {
    const { include_inactive = 'false' } = req.query;
    
    const where = {};
    if (include_inactive === 'false') {
      where.is_active = true;
    }

    const departments = await Department.findAll({
      where,
      include: [
        {
          model: Employee,
          as: 'manager',
          attributes: ['id', 'first_name', 'last_name', 'employee_id']
        },
        {
          model: Department,
          as: 'parent',
          attributes: ['id', 'name']
        },
        {
          model: Department,
          as: 'children',
          attributes: ['id', 'name']
        },
        {
          model: Employee,
          as: 'employees',
          attributes: ['id', 'first_name', 'last_name', 'employee_id'],
          where: { status: 'active' },
          required: false
        }
      ],
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    // 计算每个部门的员工数量
    const departmentsWithStats = departments.map(dept => {
      const deptData = dept.toJSON();
      deptData.employee_count = deptData.employees ? deptData.employees.length : 0;
      return deptData;
    });

    res.standard(departmentsWithStats, {
      message: '部门列表获取成功',
      status: 200
    });
  } catch (error) {
    console.error('获取部门列表失败:', error);
    return sendError(res, 'INTERNAL_ERROR', '获取部门列表失败', error.message);
  }
};

// 创建新部门
const createDepartment = async (req, res) => {
  try {
    const { name, description, manager_id, parent_id, sort_order = 0 } = req.body;

    if (!name) {
      return sendError(res, 'VALIDATION_ERROR', '部门名称不能为空');
    }

    // 检查部门名称是否已存在
    const existingDept = await Department.findOne({ where: { name } });
    if (existingDept) {
      return sendError(res, 'VALIDATION_ERROR', '部门名称已存在');
    }

    // 如果指定了主管，检查主管是否存在
    if (manager_id) {
      const manager = await Employee.findByPk(manager_id);
      if (!manager) {
        return sendError(res, 'VALIDATION_ERROR', '指定的主管不存在');
      }
    }

    // 如果指定了上级部门，检查上级部门是否存在
    if (parent_id) {
      const parentDept = await Department.findByPk(parent_id);
      if (!parentDept) {
        return sendError(res, 'VALIDATION_ERROR', '指定的上级部门不存在');
      }
    }

    const department = await Department.create({
      name,
      description,
      manager_id,
      parent_id,
      sort_order,
      is_active: true
    });

    // 返回完整的部门信息
    const fullDepartment = await Department.findByPk(department.id, {
      include: [
        {
          model: Employee,
          as: 'manager',
          attributes: ['id', 'first_name', 'last_name', 'employee_id']
        },
        {
          model: Department,
          as: 'parent',
          attributes: ['id', 'name']
        }
      ]
    });

    res.standard(fullDepartment, {
      message: '部门创建成功',
      status: 201
    });
  } catch (error) {
    console.error('创建部门失败:', error);
    return sendError(res, 'INTERNAL_ERROR', '创建部门失败', error.message);
  }
};

// 更新部门信息
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, manager_id, parent_id, sort_order, is_active } = req.body;

    const department = await Department.findByPk(id);
    if (!department) {
      return sendError(res, 'NOT_FOUND', '部门不存在');
    }

    // 如果更新名称，检查新名称是否已存在
    if (name && name !== department.name) {
      const existingDept = await Department.findOne({ 
        where: { 
          name,
          id: { [Op.ne]: id }
        }
      });
      if (existingDept) {
        return sendError(res, 'VALIDATION_ERROR', '部门名称已存在');
      }
    }

    // 如果指定了主管，检查主管是否存在
    if (manager_id) {
      const manager = await Employee.findByPk(manager_id);
      if (!manager) {
        return sendError(res, 'VALIDATION_ERROR', '指定的主管不存在');
      }
    }

    // 如果指定了上级部门，检查上级部门是否存在且不形成循环引用
    if (parent_id) {
      if (parent_id === parseInt(id)) {
        return sendError(res, 'VALIDATION_ERROR', '部门不能设置自己为上级部门');
      }
      
      const parentDept = await Department.findByPk(parent_id);
      if (!parentDept) {
        return sendError(res, 'VALIDATION_ERROR', '指定的上级部门不存在');
      }
    }

    await department.update({
      name: name || department.name,
      description: description !== undefined ? description : department.description,
      manager_id: manager_id !== undefined ? manager_id : department.manager_id,
      parent_id: parent_id !== undefined ? parent_id : department.parent_id,
      sort_order: sort_order !== undefined ? sort_order : department.sort_order,
      is_active: is_active !== undefined ? is_active : department.is_active
    });

    // 返回更新后的部门信息
    const updatedDepartment = await Department.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'manager',
          attributes: ['id', 'first_name', 'last_name', 'employee_id']
        },
        {
          model: Department,
          as: 'parent',
          attributes: ['id', 'name']
        }
      ]
    });

    res.standard(updatedDepartment, {
      message: '部门更新成功',
      status: 200
    });
  } catch (error) {
    console.error('更新部门失败:', error);
    return sendError(res, 'INTERNAL_ERROR', '更新部门失败', error.message);
  }
};

// 删除部门
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id);
    if (!department) {
      return sendError(res, 'NOT_FOUND', '部门不存在');
    }

    // 检查是否还有员工在该部门
    const employeeCount = await Employee.count({
      where: { 
        department_id: id,
        status: 'active'
      }
    });
    
    if (employeeCount > 0) {
      return sendError(res, 'VALIDATION_ERROR', '该部门还有员工，无法删除');
    }

    // 检查是否还有子部门
    const childrenCount = await Department.count({
      where: { 
        parent_id: id,
        is_active: true
      }
    });
    
    if (childrenCount > 0) {
      return sendError(res, 'VALIDATION_ERROR', '该部门还有子部门，无法删除');
    }

    // 软删除
    await department.destroy();

    res.standard(null, {
      message: '部门删除成功',
      status: 200
    });
  } catch (error) {
    console.error('删除部门失败:', error);
    return sendError(res, 'INTERNAL_ERROR', '删除部门失败', error.message);
  }
};

// 获取部门员工
const getDepartmentEmployees = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const department = await Department.findByPk(id);
    if (!department) {
      return sendError(res, 'NOT_FOUND', '部门不存在');
    }

    const offset = (page - 1) * limit;
    
    const { count, rows: employees } = await Employee.findAndCountAll({
      where: { 
        department_id: id,
        status: 'active'
      },
      attributes: [
        'id', 'employee_id', 'first_name', 'last_name', 
        'position', 'phone', 'email', 'start_date', 'status'
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['employee_id', 'ASC']]
    });

    res.standard({
      employees,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: count,
        total_pages: Math.ceil(count / limit)
      }
    }, {
      message: '部门员工列表获取成功',
      status: 200
    });
  } catch (error) {
    console.error('获取部门员工失败:', error);
    return sendError(res, 'INTERNAL_ERROR', '获取部门员工失败', error.message);
  }
};

// 获取部门考勤统计
const getDepartmentAttendanceStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const department = await Department.findByPk(id);
    if (!department) {
      return sendError(res, 'NOT_FOUND', '部门不存在');
    }

    // 获取部门所有员工
    const employees = await Employee.findAll({
      where: { 
        department_id: id,
        status: 'active'
      },
      attributes: ['id', 'employee_id']
    });

    if (employees.length === 0) {
      return res.standard({
        date,
        total_employees: 0,
        present: 0,
        late: 0,
        absent: 0,
        leave: 0
      }, {
        message: '部门考勤统计获取成功',
        status: 200
      });
    }

    // 实现真实的考勤统计计算
    let stats = { present: 0, late: 0, absent: 0, leave: 0 };
    
    if (employees.length > 0) {
      // 获取部门员工今日签到记录
      const CheckIn = require('../models').CheckIn;
      const todayCheckins = await CheckIn.findAll({
        where: {
          checkin_time: {
            [Op.gte]: new Date(date + ' 00:00:00'),
            [Op.lt]: new Date(date + ' 23:59:59')
          }
        },
        include: [{
          model: Employee,
          attributes: ['employee_id'],
          where: { 
            department_id: id,
            status: 'active'
          },
          required: true
        }],
        raw: true
      });

      // 按员工分组统计
      const employeeCheckins = {};
      todayCheckins.forEach(checkin => {
        const empId = checkin['Employee.employee_id'];
        if (!employeeCheckins[empId]) {
          employeeCheckins[empId] = { checkin: null };
        }
        
        if (checkin.checkin_type === 'in') {
          employeeCheckins[empId].checkin = new Date(checkin.checkin_time);
        }
      });

      // 计算出勤状态
      const lateThreshold = 9.25; // 9:15 AM
      
      Object.values(employeeCheckins).forEach(emp => {
        if (emp.checkin) {
          const checkinHour = emp.checkin.getHours() + emp.checkin.getMinutes() / 60;
          if (checkinHour <= lateThreshold) {
            stats.present++;
          } else {
            stats.late++;
          }
        }
      });

      // 未签到的员工为缺勤
      stats.absent = employees.length - stats.present - stats.late;
    }

    const finalStats = {
      date,
      total_employees: employees.length,
      ...stats
    };

    res.standard(finalStats, {
      message: '部门考勤统计获取成功',
      status: 200
    });
  } catch (error) {
    console.error('获取部门考勤统计失败:', error);
    return sendError(res, 'INTERNAL_ERROR', '获取部门考勤统计失败', error.message);
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentEmployees,
  getDepartmentAttendanceStats
};