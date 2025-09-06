// src/services/licenseReminder.js
const cron = require('node-cron');
const { Op } = require('sequelize');
const { EmployeeLicense, LicenseReminderLog, LicenseType, Employee } = require('../models');
const { emitLicenseEvent } = require('../utils/websocket');

/**
 * 计算剩余天数
 * @param {Date} expiryDate 
 * @returns {number}
 */
function getDaysRemaining(expiryDate) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 扫描即将到期的证件
 */
async function scanExpiringLicenses() {
  try {
    console.log('🔍 开始扫描即将到期的证件...');
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    // 查找30天内到期或已过期的证件
    const expiringLicenses = await EmployeeLicense.findAll({
      where: {
        expiry_date: {
          [Op.lte]: thirtyDaysFromNow
        }
      },
      include: [
        {
          model: LicenseType,
          attributes: ['id', 'name_en', 'name_zh']
        },
        {
          model: Employee,
          attributes: ['employee_id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    console.log(`📊 发现 ${expiringLicenses.length} 个即将到期或已过期的证件`);

    // 分类处理不同到期时间节点
    const reminderNodes = [30, 14, 7, 3, 1, 0, -1]; // 包括已过期1天
    
    for (const license of expiringLicenses) {
      const daysRemaining = getDaysRemaining(license.expiry_date);
      
      // 检查是否需要发送提醒
      for (const node of reminderNodes) {
        if ((node >= 0 && daysRemaining === node) || (node < 0 && daysRemaining <= node)) {
          await createReminderLog(license, daysRemaining, node);
        }
      }
    }
    
    // 发送WebSocket事件通知前端
    if (expiringLicenses.length > 0) {
      emitLicenseEvent('license:expiring', {
        type: 'scan_complete',
        count: expiringLicenses.length,
        licenses: expiringLicenses.map(license => ({
          id: license.employee_license_id,
          employee_name: `${license.Employee.first_name} ${license.Employee.last_name}`,
          license_type: license.LicenseType.name_en,
          expiry_date: license.expiry_date,
          days_remaining: getDaysRemaining(license.expiry_date)
        }))
      });
    }
    
    console.log('✅ 证件到期扫描完成');
  } catch (error) {
    console.error('❌ 证件到期扫描失败:', error);
  }
}

/**
 * 创建提醒日志（幂等）
 * @param {Object} license 
 * @param {number} daysRemaining 
 * @param {number} reminderNode 
 */
async function createReminderLog(license, daysRemaining, reminderNode) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 检查是否已经存在相同的提醒记录（幂等性）
    const existingLog = await LicenseReminderLog.findOne({
      where: {
        employee_license_id: license.employee_license_id,
        reminder_date: today,
        days_before_expiry: reminderNode
      }
    });
    
    if (!existingLog) {
      const reminderLog = await LicenseReminderLog.create({
        employee_license_id: license.employee_license_id,
        reminder_date: today,
        days_before_expiry: reminderNode,
        expiry_date: license.expiry_date,
        reminder_type: getReminderType(reminderNode),
        status: 'sent',
        notes: `自动扫描 - 剩余 ${daysRemaining} 天`
      });
      
      console.log(`📅 创建提醒日志: 员工 ${license.Employee.first_name} ${license.Employee.last_name} 的 ${license.LicenseType.name} (剩余 ${daysRemaining} 天)`);
      
      // 发送WebSocket通知
      emitLicenseEvent('license:reminder', {
        type: 'reminder_created',
        employee_license_id: license.employee_license_id,
        employee_name: `${license.Employee.first_name} ${license.Employee.last_name}`,
        license_type: license.LicenseType.name,
        days_remaining: daysRemaining,
        reminder_type: getReminderType(reminderNode)
      });
    }
  } catch (error) {
    console.error('❌ 创建提醒日志失败:', error);
  }
}

/**
 * 获取提醒类型
 * @param {number} days 
 * @returns {string}
 */
function getReminderType(days) {
  if (days < 0) return 'expired';
  if (days === 0) return 'expires_today';
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'warning';
  return 'notice';
}

/**
 * 启动定时任务
 */
function startLicenseReminderCron() {
  if (process.env.ENABLE_LICENSE_REMINDER_CRON !== 'true') {
    console.log('ℹ️  证件提醒定时任务已禁用 (ENABLE_LICENSE_REMINDER_CRON !== true)');
    return;
  }
  
  console.log('⏰ 启动证件提醒定时任务');
  
  // 每天早上8点执行扫描
  cron.schedule('0 8 * * *', () => {
    console.log('⏰ 定时任务触发 - 证件到期扫描');
    scanExpiringLicenses();
  }, {
    timezone: process.env.TIMEZONE || 'Australia/Perth'
  });
  
  // 开发模式：每分钟执行一次（用于测试）
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 开发模式：启用每分钟扫描（测试用）');
    cron.schedule('*/1 * * * *', () => {
      console.log('🔧 开发模式定时任务 - 证件到期扫描');
      scanExpiringLicenses();
    });
  }
}

/**
 * 手动触发扫描（用于API调用）
 */
async function triggerManualScan() {
  console.log('🔧 手动触发证件到期扫描');
  await scanExpiringLicenses();
}

module.exports = {
  startLicenseReminderCron,
  scanExpiringLicenses,
  triggerManualScan,
  getDaysRemaining
};