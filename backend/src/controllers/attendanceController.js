// src/controllers/attendanceController.js
const { Attendance, User, CheckIn, Employee } = require('../models');
const { resolveError } = require('../utils/errorCodes');
const { Op } = require('sequelize');

function sendError(res, code, overrideMessage, details){
  const { status, message, payload } = resolveError(code, overrideMessage, details);
  return res.standard(payload, { message, status });
}

const getAttendanceStats = async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    // 获取所有活跃员工
    const totalEmployees = await Employee.count({
      where: { status: 'active' }
    });

    if (totalEmployees === 0) {
      return res.standard({
        date,
        total_employees: 0,
        present: 0,
        late: 0,
        absent: 0,
        leave: 0
      }, { message: '考勤统计获取成功' });
    }

    // 获取指定日期的考勤记录
    const attendanceRecords = await Attendance.findAll({
      where: {
        date: date
      },
      include: [{
        model: User,
        attributes: ['id', 'name', 'employee_id']
      }],
      raw: true
    });

    // 从签到记录计算真实的考勤统计
    let stats = { present: 0, late: 0, absent: 0, leave: 0 };
    
    if (totalEmployees === 0) {
      return res.standard({
        date,
        total_employees: 0,
        present: 0,
        late: 0,
        absent: 0,
        leave: 0
      }, { message: '考勤统计获取成功' });
    }

    // 获取指定日期的签到记录
    const todayCheckins = await CheckIn.findAll({
      where: {
        checkin_time: {
          [Op.gte]: new Date(date + ' 00:00:00'),
          [Op.lt]: new Date(date + ' 23:59:59')
        }
      },
      include: [{
        model: Employee,
        attributes: ['id', 'employee_id', 'first_name', 'last_name'],
        where: { status: 'active' },
        required: true
      }]
    });

    // 按员工分组并计算状态
    const employeeAttendance = {};
    todayCheckins.forEach(checkin => {
      const empId = checkin.employee_id;
      if (!employeeAttendance[empId]) {
        employeeAttendance[empId] = { 
          checkin: null, 
          checkout: null, 
          isApproved: false 
        };
      }
      
      const isApproved = checkin.status === 'approved';
      if (checkin.checkin_type === 'in') {
        employeeAttendance[empId].checkin = new Date(checkin.checkin_time);
        employeeAttendance[empId].isApproved = isApproved;
      } else if (checkin.checkin_type === 'out') {
        employeeAttendance[empId].checkout = new Date(checkin.checkin_time);
      }
    });

    // 计算每个员工的考勤状态
    Object.values(employeeAttendance).forEach(emp => {
      const attendanceStatus = calculateAttendanceStatus(emp.checkin, emp.isApproved, emp.checkout);
      stats[attendanceStatus]++;
    });

    // 计算缺勤人数（没有签到记录的员工）
    const recordedEmployees = Object.keys(employeeAttendance).length;
    stats.absent += (totalEmployees - recordedEmployees);

    return res.standard({
      date,
      total_employees: totalEmployees,
      ...stats
    }, { message: '考勤统计获取成功' });
  } catch (e) { 
    console.error('获取考勤统计失败:', e);
    return sendError(res, 'INTERNAL_ERROR', '获取考勤统计失败', e.message); 
  }
};

// 计算考勤状态的辅助函数
const calculateAttendanceStatus = (checkinTime, isApproved = true, checkoutTime = null) => {
  if (!checkinTime) return 'absent';
  if (!isApproved) return 'absent'; // 未批准的签到视为缺勤
  
  const checkinHour = checkinTime.getHours() + checkinTime.getMinutes() / 60;
  const lateThreshold = 9.25; // 9:15 AM
  
  if (checkinHour <= lateThreshold) {
    return 'present'; // 正常出勤
  } else {
    return 'late'; // 迟到
  }
};


const listAttendanceRecords = async (req,res)=>{
  try {
    const { page=1, limit=10, search, status, startDate, endDate } = req.query;
    const pageNum = parseInt(page); 
    const perPage = parseInt(limit); 
    const offset = (pageNum-1)*perPage;
    
    // 构建查询条件
    const where = {};
    if (startDate && endDate) {
      where.checkin_time = { 
        [Op.between]: [
          new Date(startDate + ' 00:00:00'), 
          new Date(endDate + ' 23:59:59')
        ] 
      };
    }

    // 构建员工查询条件
    const employeeWhere = {};
    if (search) {
      employeeWhere[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name: { [Op.like]: `%${search}%` } },
        { employee_id: { [Op.like]: `%${search}%` } }
      ];
    }

    // 从checkins表获取数据，关联员工信息
    const records = await CheckIn.findAll({
      where,
      include: [{
        model: Employee,
        attributes: ['employee_id', 'first_name', 'last_name', 'department_id'],
        where: employeeWhere,
        required: true
      }],
      order: [['checkin_time', 'DESC']],
      attributes: [
        'id', 'employee_id', 'checkin_type', 'checkin_time', 
        'latitude', 'longitude', 'location_accuracy', 'address',
        'status', 'created_at'
      ]
    });

    // 按员工和日期分组，合并签到和签退记录
    const groupedRecords = {};
    records.forEach(record => {
      const date = record.checkin_time.toISOString().split('T')[0];
      const key = `${record.employee_id}-${date}`;
      const employeeName = record.Employee ? 
        `${record.Employee.first_name} ${record.Employee.last_name}`.trim() : 
        'Unknown Employee';
      
      if (!groupedRecords[key]) {
        groupedRecords[key] = {
          id: record.id,
          employee_id: record.employee_id,
          date: date,
          check_in: null,
          check_out: null,
          check_in_time: null,
          check_out_time: null,
          work_hours: null,
          status: 'absent', // 默认缺勤，后续根据签到情况计算
          is_approved: false,
          User: {
            id: record.employee_id,
            employee_id: record.employee_id,
            name: employeeName,
            department: record.Employee?.department_id || 'Unknown'
          }
        };
      }
      
      const timeString = record.checkin_time.toTimeString().split(' ')[0];
      const isApproved = record.status === 'approved';
      
      if (record.checkin_type === 'in') {
        groupedRecords[key].check_in = timeString;
        groupedRecords[key].check_in_time = record.checkin_time;
        groupedRecords[key].is_approved = isApproved;
      } else if (record.checkin_type === 'out') {
        groupedRecords[key].check_out = timeString;
        groupedRecords[key].check_out_time = record.checkin_time;
      }
    });

    // 计算考勤状态和工作时长
    Object.values(groupedRecords).forEach(record => {
      // 计算考勤状态
      if (record.check_in_time) {
        record.status = calculateAttendanceStatus(record.check_in_time, record.is_approved, record.check_out_time);
      } else {
        record.status = 'absent'; // 没有签到记录为缺勤
      }
      
      // 计算工作时长
      if (record.check_in && record.check_out) {
        const checkIn = new Date(`${record.date} ${record.check_in}`);
        const checkOut = new Date(`${record.date} ${record.check_out}`);
        const diffMs = checkOut - checkIn;
        record.work_hours = Math.round(diffMs / (1000 * 60 * 60) * 100) / 100; // 小时，保留2位小数
      }
      
      // 清理临时字段
      delete record.check_in_time;
      delete record.check_out_time;
      delete record.is_approved;
    });

    const finalRecords = Object.values(groupedRecords);
    
    // 应用状态过滤
    let filteredRecords = finalRecords;
    if (status && status !== 'all') {
      filteredRecords = finalRecords.filter(record => record.status === status);
    }
    
    // 应用分页
    const totalRecords = filteredRecords.length;
    const paginatedRecords = filteredRecords.slice(offset, offset + perPage);

    return res.standard({
      records: paginatedRecords,
      pagination: {
        current_page: pageNum,
        per_page: perPage,
        total: totalRecords,
        total_pages: Math.ceil(totalRecords / perPage)
      }
    }, { message: '考勤记录获取成功' });
    
  } catch (e) { 
    console.error('获取考勤记录失败:', e);
    return sendError(res,'INTERNAL_ERROR','获取考勤记录失败', e.message); 
  }
};

const checkinOrOut = async (req,res)=>{
  try {
    const { type, location } = req.body; // in / out
    if (!['in','out'].includes(type)) return sendError(res,'VALIDATION_ERROR','无效打卡类型');
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toTimeString().split(' ')[0];
    let attendance = await Attendance.findOne({ where: { user_id: userId, date: today } });
    if (!attendance) attendance = await Attendance.create({ user_id: userId, date: today });
    if (type==='in') {
      attendance.check_in = currentTime; attendance.check_in_location = location; attendance.status = 'present';
    } else {
      attendance.check_out = currentTime; attendance.check_out_location = location;
      if (attendance.check_in) {
        const checkIn = new Date(`1970-01-01T${attendance.check_in}`);
        const checkOut = new Date(`1970-01-01T${currentTime}`);
        const diffHours = (checkOut - checkIn) / (1000*60*60);
        attendance.work_hours = Math.round(diffHours*100)/100;
      }
    }
    await attendance.save();
    return res.standard(attendance, { message: `${type==='in'?'上班':'下班'}打卡成功` });
  } catch (e) { return sendError(res,'INTERNAL_ERROR','打卡失败', e.message); }
};

module.exports = { getAttendanceStats, listAttendanceRecords, checkinOrOut };