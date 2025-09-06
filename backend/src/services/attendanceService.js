// attendanceService.js
// 出勤/考勤相关业务逻辑抽象 (Skeleton)
const { Attendance, Employee } = require('../models');

module.exports = {
  async listEmployeeAttendance(employee_id, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const { count, rows } = await Attendance.findAndCountAll({
      where: { employee_id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    return { items: rows, pagination: { page: +page, per_page: +limit, total: count, total_pages: Math.ceil(count / limit) } };
  },
  async summary() {
    const total = await Attendance.count();
    const employees = await Employee.count();
    return { total_records: total, employees };
  }
};