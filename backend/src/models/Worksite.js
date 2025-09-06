// src/models/Worksite.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Worksite = sequelize.define('Worksite', {
    // 基本信息
    worksite_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      comment: '工地编号'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '工地名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '工地描述'
    },
    
    // 地理位置
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
      comment: '工地半径 (米)'
    },
    
    // 地址信息
    street_address: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '街道地址'
    },
    suburb: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '郊区'
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '州'
    },
    postcode: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '邮编'
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Australia',
      comment: '国家'
    },
    
    // 工作时间设置
    standard_work_start: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '07:00:00',
      comment: '标准上班时间'
    },
    standard_work_end: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '17:00:00',
      comment: '标准下班时间'
    },
    break_start: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: '12:00:00',
      comment: '午休开始时间'
    },
    break_end: {
      type: DataTypes.TIME,
      allowNull: true,
      defaultValue: '13:00:00',
      comment: '午休结束时间'
    },
    
    // 签到规则
    early_checkin_buffer: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      comment: '允许提前签到时间 (分钟)'
    },
    late_checkin_tolerance: {
      type: DataTypes.INTEGER,
      defaultValue: 15,
      comment: '迟到容忍时间 (分钟)'
    },
    require_photo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否必须拍照签到'
    },
    require_gps: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否必须GPS定位'
    },
    max_gps_accuracy: {
      type: DataTypes.INTEGER,
      defaultValue: 20,
      comment: '最大GPS精度要求 (米)'
    },
    
    // 安全要求
    require_white_card: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否要求White Card'
    },
    require_safety_induction: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否要求安全培训'
    },
    ppe_requirements: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'PPE要求列表'
    },
    
    // 项目信息
    project_manager: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '项目经理'
    },
    project_manager_phone: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '项目经理电话'
    },
    contractor_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '承包商名称'
    },
    client_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '客户名称'
    },
    
    // 项目状态
    status: {
      type: DataTypes.ENUM('planning', 'active', 'suspended', 'completed', 'cancelled'),
      defaultValue: 'active',
      comment: '项目状态'
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '项目开始日期'
    },
    estimated_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '预计结束日期'
    },
    actual_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '实际结束日期'
    },
    
    // 天气监控
    weather_restrictions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '天气限制条件'
    },
    
    // 系统设置
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'Australia/Perth',
      comment: '时区'
    },
    allow_remote_checkin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否允许远程签到'
    },
    
    // 统计信息
    total_employees: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '总员工数'
    },
    active_employees: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '活跃员工数'
    }
  }, {
    tableName: 'worksites',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['worksite_id'] },
      { fields: ['status'] },
      { fields: ['center_latitude', 'center_longitude'] },
      { fields: ['postcode'] },
      { fields: ['state'] }
    ]
  });

  return Worksite;
};