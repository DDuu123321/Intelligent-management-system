// src/models/EmployeeLicense.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmployeeLicense = sequelize.define('EmployeeLicense', {
    employee_license_id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    employee_id: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '关联员工编号（非自增主键）'
    },
    license_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '关联 LicenseType ID'
    },
    number: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '证件编号'
    },
    issue_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '签发日期'
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '到期日期'
    },
    custom_advance_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '自定义提醒提前天数（覆盖类型默认）'
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '上传的扫描件路径'
    },
    ocr_raw_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'OCR 原始识别文本'
    },
    parsed_expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'OCR 解析出的到期日期（待人工确认）'
    },
    parse_confidence: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: '解析置信度 0-1'
    },
    ocr_status: {
      type: DataTypes.ENUM('none', 'parsed', 'low_confidence', 'confirmed', 'rejected'),
      defaultValue: 'none',
      comment: 'OCR状态: none=未处理, parsed=已解析, low_confidence=低置信度, confirmed=人工确认, rejected=人工拒绝'
    },
    scan_status: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '文件病毒扫描状态 pending/clean/blocked'
    },
    scan_message: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '扫描结果说明'
    }
  }, {
    tableName: 'employee_licenses',
    timestamps: true,
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['license_type_id'] },
      { fields: ['expiry_date'] }
    ]
  });

  return EmployeeLicense;
};