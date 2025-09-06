// src/routes/employees.js
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getDepartments,
  batchImportEmployees
} = require('../controllers/employeeController');

const router = express.Router();

// 部门列表需要放在动态ID路由之前以避免匹配冲突
router.get('/departments/list', authenticateToken, getDepartments);
// 批量导入
router.post('/batch-import', authenticateToken, batchImportEmployees);

// 获取所有员工
router.get('/', authenticateToken, getAllEmployees);
// 创建新员工
router.post('/', authenticateToken, createEmployee);
// 获取单个员工详情
router.get('/:employee_id', authenticateToken, getEmployeeById);
// 更新员工信息
router.put('/:employee_id', authenticateToken, updateEmployee);
// 删除员工（软删除）
router.delete('/:employee_id', authenticateToken, deleteEmployee);

module.exports = router;