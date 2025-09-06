// src/models/LicenseType.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LicenseType = sequelize.define('LicenseType', {
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '唯一代码，例如 WHITE_CARD'
    },
    name_en: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '英文名称'
    },
    name_zh: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '中文名称，可为空'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '分类，例如 safety / equipment / health'
    },
    default_advance_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 30,
      comment: '默认提醒提前天数'
    },
    is_system: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否系统预置，不允许删除'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否启用'
    }
  }, {
    tableName: 'license_types',
    timestamps: true,
    indexes: [
      { fields: ['code'] },
      { fields: ['category'] },
      { fields: ['active'] }
    ]
  });

  return LicenseType;
};