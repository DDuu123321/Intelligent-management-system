// src/controllers/attendanceStatsController.js
const { Op } = require('sequelize');
const { Employee, CheckIn, QRCode, Worksite, sequelize } = require('../models');
const { resolveError } = require('../utils/errorCodes');

class AttendanceStatsController {
  // 获取考勤概览统计
  async getOverviewStats(req, res) {
    try {
      const { date_from, date_to, worksite_id } = req.query;
      
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
      
      // 构建查询条件
      let dateFilter = {
        checkin_time: {
          [Op.between]: [startOfToday, endOfToday]
        }
      };
      
      if (date_from && date_to) {
        dateFilter.checkin_time = {
          [Op.between]: [new Date(date_from), new Date(date_to)]
        };
      }
      
      const whereClause = { ...dateFilter };
      if (worksite_id) {
        whereClause.worksite_id = worksite_id;
      }

      // 今日签到统计
      const todayStats = await CheckIn.findAll({
        where: whereClause,
        attributes: [
          'checkin_type',
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['checkin_type', 'status'],
        raw: true
      });

      // 员工总数
      const totalEmployees = await Employee.count({
        where: { status: 'active' }
      });

      // 今日已签到员工数
      const todayCheckedInEmployees = await CheckIn.count({
        where: {
          ...dateFilter,
          checkin_type: 'in',
          ...(worksite_id && { worksite_id })
        },
        distinct: true,
        col: 'employee_id'
      });

      // 异常签到数量
      const suspiciousCheckins = await CheckIn.count({
        where: {
          ...whereClause,
          is_suspicious: true
        }
      });

      // 待审核签到数量
      const pendingCheckins = await CheckIn.count({
        where: {
          ...whereClause,
          status: 'pending'
        }
      });

      // 处理统计数据
      const statsMap = {};
      todayStats.forEach(stat => {
        const key = `${stat.checkin_type}_${stat.status}`;
        statsMap[key] = parseInt(stat.count);
      });

      return res.standard({
        total_employees: totalEmployees,
        today_checked_in: todayCheckedInEmployees,
        today_checkin_success: statsMap['in_approved'] || 0,
        today_checkout_success: statsMap['out_approved'] || 0,
        suspicious_checkins: suspiciousCheckins,
        pending_checkins: pendingCheckins,
        attendance_rate: totalEmployees > 0 ? Math.round((todayCheckedInEmployees / totalEmployees) * 100) : 0,
        detailed_stats: todayStats
      }, { message: '获取考勤概览成功' });
    } catch (err) {
      console.error('获取考勤概览失败:', err);
      const { status, message, payload } = resolveError('INTERNAL_ERROR', '获取考勤概览失败');
      return res.standard(payload, { message, status });
    }
  }

  // 获取员工考勤详细统计
  async getEmployeeStats(req, res) {
    try {
      const { employee_id, date_from, date_to, worksite_id } = req.query;
      const { page = 1, limit = 10 } = req.query;

      // 构建时间筛选条件
      let dateFilter = {};
      if (date_from && date_to) {
        dateFilter.checkin_time = {
          [Op.between]: [new Date(date_from), new Date(date_to + ' 23:59:59')]
        };
      } else {
        // 默认最近30天
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        dateFilter.checkin_time = {
          [Op.gte]: thirtyDaysAgo
        };
      }

      const whereClause = { ...dateFilter };
      if (employee_id) whereClause.employee_id = employee_id;
      if (worksite_id) whereClause.worksite_id = worksite_id;

      // 获取考勤记录
      const checkinRecords = await CheckIn.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Employee,
            attributes: ['employee_id', 'first_name', 'last_name', 'position', 'department']
          }
        ],
        order: [['checkin_time', 'DESC']],
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      });

      // 计算统计数据
      const allRecords = await CheckIn.findAll({
        where: whereClause,
        attributes: [
          'employee_id',
          'checkin_type',
          'status',
          'checkin_time',
          'work_duration',
          'overtime_hours',
          'is_suspicious'
        ],
        include: [
          {
            model: Employee,
            attributes: ['first_name', 'last_name', 'hourly_rate']
          }
        ]
      });

      // 按员工聚合统计
      const employeeStats = {};
      allRecords.forEach(record => {
        const empId = record.employee_id;
        if (!employeeStats[empId]) {
          employeeStats[empId] = {
            employee_id: empId,
            employee_name: `${record.Employee.first_name} ${record.Employee.last_name}`,
            hourly_rate: record.Employee.hourly_rate,
            total_checkins: 0,
            successful_checkins: 0,
            total_work_hours: 0,
            total_overtime_hours: 0,
            suspicious_count: 0,
            days_worked: new Set()
          };
        }
        
        const stats = employeeStats[empId];
        stats.total_checkins++;
        
        if (record.status === 'approved') {
          stats.successful_checkins++;
        }
        
        if (record.work_duration) {
          stats.total_work_hours += record.work_duration / 60; // 转换为小时
        }
        
        if (record.overtime_hours) {
          stats.total_overtime_hours += record.overtime_hours;
        }
        
        if (record.is_suspicious) {
          stats.suspicious_count++;
        }
        
        // 记录工作天数
        const workDate = new Date(record.checkin_time).toDateString();
        stats.days_worked.add(workDate);
      });

      // 计算最终统计
      const finalStats = Object.values(employeeStats).map(stats => ({
        ...stats,
        days_worked: stats.days_worked.size,
        average_hours_per_day: stats.days_worked.size > 0 ? 
          (stats.total_work_hours / stats.days_worked.size).toFixed(2) : 0,
        estimated_earnings: (stats.total_work_hours * stats.hourly_rate).toFixed(2),
        attendance_rate: stats.total_checkins > 0 ? 
          Math.round((stats.successful_checkins / stats.total_checkins) * 100) : 0
      }));

      return res.standard({
        records: checkinRecords.rows,
        stats: finalStats,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: checkinRecords.count,
          total_pages: Math.ceil(checkinRecords.count / parseInt(limit))
        }
      }, { message: '获取员工考勤统计成功' });
    } catch (err) {
      console.error('获取员工考勤统计失败:', err);
      const { status, message, payload } = resolveError('INTERNAL_ERROR', '获取员工考勤统计失败');
      return res.standard(payload, { message, status });
    }
  }

  // 获取工地考勤统计
  async getWorksiteStats(req, res) {
    try {
      const { date_from, date_to } = req.query;
      
      // 默认查询最近7天
      const endDate = date_to ? new Date(date_to + ' 23:59:59') : new Date();
      const startDate = date_from ? new Date(date_from) : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

      const whereClause = {
        checkin_time: {
          [Op.between]: [startDate, endDate]
        }
      };

      // 按工地统计签到数据
      const worksiteStats = await CheckIn.findAll({
        where: whereClause,
        attributes: [
          'worksite_id',
          [sequelize.fn('COUNT', sequelize.col('CheckIn.id')), 'total_checkins'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('employee_id'))), 'unique_employees'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "approved" THEN 1 ELSE 0 END')), 'approved_checkins'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN is_suspicious = 1 THEN 1 ELSE 0 END')), 'suspicious_checkins'],
          [sequelize.fn('AVG', sequelize.col('work_duration')), 'avg_work_duration'],
          [sequelize.fn('SUM', sequelize.col('overtime_hours')), 'total_overtime']
        ],
        include: [
          {
            model: QRCode,
            attributes: ['worksite_name', 'scan_count', 'successful_checkins'],
            required: false
          }
        ],
        group: ['worksite_id'],
        raw: false
      });

      // 获取工地基本信息
      const worksites = await Worksite.findAll({
        attributes: ['worksite_id', 'name', 'address']
      });

      const worksiteMap = {};
      worksites.forEach(site => {
        worksiteMap[site.worksite_id] = site;
      });

      // 处理统计结果
      const processedStats = worksiteStats.map(stat => ({
        worksite_id: stat.worksite_id,
        worksite_name: worksiteMap[stat.worksite_id]?.name || stat.worksite_id,
        worksite_address: worksiteMap[stat.worksite_id]?.address || '',
        total_checkins: parseInt(stat.dataValues.total_checkins) || 0,
        unique_employees: parseInt(stat.dataValues.unique_employees) || 0,
        approved_checkins: parseInt(stat.dataValues.approved_checkins) || 0,
        suspicious_checkins: parseInt(stat.dataValues.suspicious_checkins) || 0,
        approval_rate: stat.dataValues.total_checkins > 0 ? 
          Math.round((stat.dataValues.approved_checkins / stat.dataValues.total_checkins) * 100) : 0,
        avg_work_hours: stat.dataValues.avg_work_duration ? 
          (stat.dataValues.avg_work_duration / 60).toFixed(2) : 0,
        total_overtime: parseFloat(stat.dataValues.total_overtime) || 0,
        qr_scan_count: stat.QRCode?.scan_count || 0,
        qr_success_rate: stat.QRCode?.scan_count > 0 ? 
          Math.round((stat.QRCode.successful_checkins / stat.QRCode.scan_count) * 100) : 0
      }));

      return res.standard({
        date_range: { start: startDate, end: endDate },
        worksite_stats: processedStats,
        summary: {
          total_worksites: processedStats.length,
          total_checkins: processedStats.reduce((sum, stat) => sum + stat.total_checkins, 0),
          total_employees: processedStats.reduce((sum, stat) => sum + stat.unique_employees, 0),
          average_approval_rate: processedStats.length > 0 ? 
            Math.round(processedStats.reduce((sum, stat) => sum + stat.approval_rate, 0) / processedStats.length) : 0
        }
      }, { message: '获取工地考勤统计成功' });
    } catch (err) {
      console.error('获取工地考勤统计失败:', err);
      const { status, message, payload } = resolveError('INTERNAL_ERROR', '获取工地考勤统计失败');
      return res.standard(payload, { message, status });
    }
  }

  // 获取考勤趋势数据
  async getTrendData(req, res) {
    try {
      const { period = 'week', worksite_id } = req.query; // week, month, year
      
      let dateFormat, dateRange;
      const now = new Date();
      
      switch (period) {
        case 'week':
          // 最近7天
          dateFormat = '%Y-%m-%d';
          dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          // 最近30天
          dateFormat = '%Y-%m-%d';
          dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          // 最近12个月
          dateFormat = '%Y-%m';
          dateRange = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFormat = '%Y-%m-%d';
          dateRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const whereClause = {
        checkin_time: {
          [Op.gte]: dateRange
        }
      };
      if (worksite_id) whereClause.worksite_id = worksite_id;

      // 按时间段统计 - 使用SQLite兼容的date函数
      let dateFunction;
      if (period === 'year') {
        dateFunction = sequelize.fn('strftime', '%Y-%m', sequelize.col('checkin_time'));
      } else {
        dateFunction = sequelize.fn('date', sequelize.col('checkin_time'));
      }

      const trendData = await CheckIn.findAll({
        where: whereClause,
        attributes: [
          [dateFunction, 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'total_checkins'],
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('employee_id'))), 'unique_employees'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN status = "approved" THEN 1 ELSE 0 END')), 'approved_checkins'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN checkin_type = "in" THEN 1 ELSE 0 END')), 'checkin_count'],
          [sequelize.fn('SUM', sequelize.literal('CASE WHEN checkin_type = "out" THEN 1 ELSE 0 END')), 'checkout_count']
        ],
        group: [dateFunction],
        order: [[dateFunction, 'ASC']],
        raw: true
      });

      return res.standard({
        period,
        trend_data: trendData.map(item => ({
          date: item.date,
          total_checkins: parseInt(item.total_checkins),
          unique_employees: parseInt(item.unique_employees),
          approved_checkins: parseInt(item.approved_checkins),
          checkin_count: parseInt(item.checkin_count),
          checkout_count: parseInt(item.checkout_count),
          approval_rate: item.total_checkins > 0 ? 
            Math.round((item.approved_checkins / item.total_checkins) * 100) : 0
        }))
      }, { message: '获取考勤趋势数据成功' });
    } catch (err) {
      console.error('获取考勤趋势数据失败:', err);
      const { status, message, payload } = resolveError('INTERNAL_ERROR', '获取考勤趋势数据失败');
      return res.standard(payload, { message, status });
    }
  }

  // 导出考勤报表
  async exportReport(req, res) {
    try {
      const { format = 'json', date_from, date_to, worksite_id, employee_id } = req.query;
      
      const whereClause = {};
      if (date_from && date_to) {
        whereClause.checkin_time = {
          [Op.between]: [new Date(date_from), new Date(date_to + ' 23:59:59')]
        };
      }
      if (worksite_id) whereClause.worksite_id = worksite_id;
      if (employee_id) whereClause.employee_id = employee_id;

      const reportData = await CheckIn.findAll({
        where: whereClause,
        include: [
          {
            model: Employee,
            attributes: ['employee_id', 'first_name', 'last_name', 'position', 'department', 'hourly_rate']
          }
        ],
        order: [['checkin_time', 'DESC']],
        raw: false
      });

      // 处理数据
      const processedData = reportData.map(record => ({
        签到ID: record.id,
        员工工号: record.employee_id,
        员工姓名: `${record.Employee.first_name} ${record.Employee.last_name}`,
        职位: record.Employee.position,
        部门: record.Employee.department,
        签到类型: record.checkin_type === 'in' ? '上班' : '下班',
        签到时间: record.checkin_time,
        工地ID: record.worksite_id,
        位置: record.address,
        GPS坐标: record.latitude && record.longitude ? 
          `${record.latitude}, ${record.longitude}` : '',
        距离工地: record.distance_from_worksite ? `${record.distance_from_worksite}米` : '',
        状态: record.status === 'approved' ? '已批准' : 
              record.status === 'pending' ? '待审核' : 
              record.status === 'rejected' ? '已拒绝' : '已标记',
        是否异常: record.is_suspicious ? '是' : '否',
        异常原因: record.suspicious_reasons ? 
          (Array.isArray(record.suspicious_reasons) ? 
            record.suspicious_reasons.join(', ') : record.suspicious_reasons) : '',
        工作时长: record.work_duration ? `${Math.round(record.work_duration / 60)}分钟` : '',
        加班时长: record.overtime_hours ? `${record.overtime_hours}小时` : '',
        设备类型: record.device_type,
        IP地址: record.ip_address,
        创建时间: record.created_at
      }));

      if (format === 'csv') {
        // 生成CSV格式
        const csvHeaders = Object.keys(processedData[0] || {});
        const csvContent = [
          csvHeaders.join(','),
          ...processedData.map(row => 
            csvHeaders.map(header => `"${row[header] || ''}"`).join(',')
          )
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=attendance-report-${Date.now()}.csv`);
        return res.send(csvContent);
      }

      return res.standard({
        total_records: processedData.length,
        export_time: new Date().toISOString(),
        filters: { date_from, date_to, worksite_id, employee_id },
        records: processedData
      }, { message: '导出考勤报表成功' });
    } catch (err) {
      console.error('导出考勤报表失败:', err);
      const { status, message, payload } = resolveError('INTERNAL_ERROR', '导出考勤报表失败');
      return res.standard(payload, { message, status });
    }
  }
}

module.exports = new AttendanceStatsController();