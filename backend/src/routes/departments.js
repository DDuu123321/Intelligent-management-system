// src/routes/departments.js
console.log('🔧 Loading department routes...');
const express = require('express');
const router = express.Router();
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentEmployees,
  getDepartmentAttendanceStats
} = require('../controllers/departmentController');

// 获取所有部门
router.get('/', getDepartments);

// 创建新部门
router.post('/', createDepartment);

// 更新部门信息
router.put('/:id', updateDepartment);

// 删除部门
router.delete('/:id', deleteDepartment);

// 获取部门员工
router.get('/:id/employees', getDepartmentEmployees);

// 获取部门考勤统计
router.get('/:id/attendance-stats', getDepartmentAttendanceStats);

module.exports = router;