// src/models/QRCode.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QRCode = sequelize.define('QRCode', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: '二维码唯一ID'
    },
    
    // 工地信息
    worksite_id: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '工地ID'
    },
    worksite_name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '工地名称'
    },
    
    // 二维码配置
    qr_token: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      comment: '二维码令牌'
    },
    qr_url: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '二维码链接URL'
    },
    qr_data: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '二维码数据（Base64图片）'
    },
    
    // GPS围栏设置
    center_latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      comment: '工地中心纬度'
    },
    center_longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      comment: '工地中心经度'
    },
    radius: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      comment: '允许签到范围半径（米）'
    },
    
    // 时间限制
    allow_checkin_anytime: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否允许任何时间签到'
    },
    work_start_time: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: '正常工作开始时间'
    },
    work_end_time: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: '正常工作结束时间'
    },
    
    // 验证设置
    require_photo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否要求拍照'
    },
    require_gps: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否要求GPS定位'
    },
    face_verification_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否启用人脸验证'
    },
    
    // 状态管理
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '二维码是否激活'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '过期时间'
    },
    
    // 统计信息
    scan_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '扫描次数'
    },
    successful_checkins: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '成功签到次数'
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后使用时间'
    },
    
    // 创建者信息
    created_by: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '创建者用户名'
    },
    updated_by: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '更新者用户名'
    },
    
    // 备注
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注说明'
    }
  }, {
    tableName: 'qrcodes',
    timestamps: true,
    indexes: [
      { fields: ['worksite_id'] },
      { fields: ['qr_token'] },
      { fields: ['is_active'] },
      { fields: ['expires_at'] },
      { fields: ['created_at'] }
    ]
  });

  return QRCode;
};