// src/models/CheckIn.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CheckIn = sequelize.define('CheckIn', {
    // 基本签到信息
    employee_id: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '员工编号'
    },
    checkin_type: {
      type: DataTypes.ENUM('in', 'out', 'break_start', 'break_end'),
      allowNull: false,
      comment: '签到类型: 上班/下班/休息开始/休息结束'
    },
    checkin_time: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '签到时间'
    },
    
    // 地理位置信息（防作弊）
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      comment: '纬度'
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      comment: '经度'
    },
    location_accuracy: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'GPS精度 (米)'
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '地址描述'
    },
    
    // 工地范围验证
    worksite_id: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '工地ID'
    },
    is_within_worksite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否在工地范围内'
    },
    distance_from_worksite: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: '距离工地中心距离 (米)'
    },
    
    // 照片验证（防代打卡）
    photo_url: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '签到照片URL或Base64'
    },
    face_match_confidence: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: '人脸匹配置信度 (0-1)'
    },
    face_verification_passed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '人脸验证是否通过'
    },
    
    // 设备信息
    device_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '设备ID'
    },
    device_type: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '设备类型 (iOS/Android/Web)'
    },
    app_version: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '应用版本'
    },
    ip_address: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'IP地址'
    },
    user_agent: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '用户代理'
    },
    
    // 天气信息（用于工作环境记录）
    weather_condition: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '天气状况'
    },
    temperature: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: '温度 (°C)'
    },
    
    // 验证状态
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'flagged'),
      defaultValue: 'pending',
      comment: '签到状态'
    },
    verification_method: {
      type: DataTypes.ENUM('gps_photo', 'gps_only', 'manual_override'),
      defaultValue: 'gps_photo',
      comment: '验证方式'
    },
    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '管理员备注'
    },
    
    // 异常标记
    is_suspicious: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否可疑签到'
    },
    suspicious_reasons: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '可疑原因列表'
    },
    
    // 工作时长计算
    break_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '休息时长 (分钟)'
    },
    work_duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '工作时长 (分钟)'
    },
    overtime_hours: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: '加班时长 (小时)'
    },
    
    // 安全检查
    ppe_compliance: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'PPE (个人防护设备) 合规性'
    },
    safety_briefing_acknowledged: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否确认安全简报'
    },
    
    // 系统字段
    created_by: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '创建者'
    },
    updated_by: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '更新者'
    }
  }, {
    tableName: 'checkins',
    timestamps: true,
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['checkin_time'] },
      { fields: ['checkin_type'] },
      { fields: ['worksite_id'] },
      { fields: ['status'] },
      { fields: ['is_suspicious'] },
      { fields: ['created_at'] },
      { fields: ['employee_id', 'checkin_time'] }
    ]
  });

  return CheckIn;
};