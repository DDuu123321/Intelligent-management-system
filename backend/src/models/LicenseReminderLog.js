// src/models/LicenseReminderLog.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LicenseReminderLog = sequelize.define('LicenseReminderLog', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    employee_license_id: { type: DataTypes.INTEGER, allowNull: false },
    reminder_date: { type: DataTypes.DATEONLY, allowNull: false, comment: '提醒日期' },
    days_before_expiry: { type: DataTypes.INTEGER, allowNull: false, comment: '距离到期天数' },
    expiry_date: { type: DataTypes.DATEONLY, allowNull: false, comment: '证件到期日期' },
    reminder_type: { type: DataTypes.STRING, allowNull: false, comment: '提醒类型：notice, warning, urgent, expires_today, expired' },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'sent', comment: '状态：sent, failed' },
    notes: { type: DataTypes.TEXT, allowNull: true, comment: '备注' },
    trigger_day: { type: DataTypes.INTEGER, allowNull: false, comment: '距离到期剩余天数的节点值，如30/14/7/3/1/0' },
    channel: { type: DataTypes.STRING, allowNull: false, defaultValue: 'email' },
    locale: { type: DataTypes.STRING, allowNull: true },
    sent_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'license_reminder_logs',
    timestamps: false,
    indexes: [
      { unique: true, fields: ['employee_license_id', 'trigger_day', 'channel'] },
      { fields: ['trigger_day'] }
    ]
  });

  return LicenseReminderLog;
};