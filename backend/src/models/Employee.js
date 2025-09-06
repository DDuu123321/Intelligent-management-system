// src/models/Employee.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Employee = sequelize.define('Employee', {
    // 基本信息
    employee_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      comment: '员工编号'
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '名'
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '姓'
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        isEmailOrEmpty(value) {
          if (value && value.trim() !== '') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              throw new Error('Please provide a valid email address');
            }
          }
        }
      },
      comment: '邮箱'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '电话号码'
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '出生日期'
    },
    
    // 澳大利亚法规相关
    tfn: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Tax File Number (澳洲税号)'
    },
    visa_status: {
      type: DataTypes.ENUM('citizen', 'permanent_resident', 'temporary_visa', 'working_holiday'),
      allowNull: false,
      defaultValue: 'citizen',
      comment: '签证状态'
    },
    visa_expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '签证到期日期'
    },
    
    // 建筑工地安全要求
    white_card_number: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'White Card (建筑安全卡) 编号'
    },
    white_card_expiry: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'White Card 到期日期'
    },
    safety_induction_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '安全培训是否完成'
    },
    safety_induction_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '安全培训完成日期'
    },
    
    // 工作信息
    position: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '职位'
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      },
      comment: '部门ID'
    },
    hourly_rate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '时薪 (AUD)'
    },
    employment_type: {
      type: DataTypes.ENUM('full_time', 'part_time', 'casual', 'contractor'),
      allowNull: false,
      defaultValue: 'full_time',
      comment: '雇佣类型'
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '入职日期'
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '离职日期'
    },
    
    // 状态管理
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'terminated'),
      defaultValue: 'active',
      comment: '员工状态'
    },
    can_checkin: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否允许签到'
    },
    
    // 紧急联系人
    emergency_contact_name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '紧急联系人姓名'
    },
    emergency_contact_phone: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '紧急联系人电话'
    },
    emergency_contact_relationship: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '与紧急联系人关系'
    },
    
    // 银行信息（用于工资发放）
    bank_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '银行名称'
    },
    bsb: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'BSB号码'
    },
    account_number: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '账户号码'
    },
    account_name: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: '账户名称'
    },
    
    // 系统字段
    profile_photo: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '员工照片 (Base64或URL)'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    }
  }, {
    tableName: 'employees',
    timestamps: true,
    paranoid: true, // 软删除
    indexes: [
      { fields: ['employee_id'] },
      { fields: ['email'] },
      { fields: ['phone'] },
      { fields: ['white_card_number'] },
      { fields: ['status'] }
    ]
  });

  Employee.associate = function(models) {
    // 员工属于一个部门
    Employee.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department'
    });
    
    // 员工有多个考勤记录
    Employee.hasMany(models.Attendance, {
      foreignKey: 'user_id',
      as: 'attendances'
    });
    
    // 员工有多个打卡记录
    Employee.hasMany(models.CheckIn, {
      foreignKey: 'employee_id',
      as: 'checkins'
    });
    
    // 员工有多个证件记录
    Employee.hasMany(models.EmployeeLicense, {
      foreignKey: 'employee_id',
      as: 'licenses'
    });
  };

  return Employee;
};