// src/models/index.js
const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// 双驱动配置：支持 PostgreSQL 和 SQLite
let sequelize;

if (process.env.DB_DIALECT === 'postgres') {
  // PostgreSQL 配置
  sequelize = new Sequelize(process.env.DATABASE_URL || {
    database: process.env.DB_NAME || 'fleet_management',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || 'password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
  });
} else {
  // SQLite 配置 (默认) - 使用 better-sqlite3
  const dbPath = process.env.NODE_ENV === 'test' 
    ? ':memory:' 
    : path.join(__dirname, '../../database.sqlite');
    
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    dialectOptions: {
      module: require('better-sqlite3')
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
    },
  });
}

// 导入模型
const User = require('./User')(sequelize);
const Attendance = require('./Attendance')(sequelize);
const Vehicle = require('./Vehicle')(sequelize);
const Camera = require('./Camera')(sequelize);
const Alert = require('./Alert')(sequelize);
const Employee = require('./Employee')(sequelize);
const CheckIn = require('./CheckIn')(sequelize);
const Worksite = require('./Worksite')(sequelize);
const QRCode = require('./QRCode')(sequelize);
const LicenseType = require('./LicenseType')(sequelize);
const EmployeeLicense = require('./EmployeeLicense')(sequelize);
const LicenseReminderLog = require('./LicenseReminderLog')(sequelize);
const Sequence = require('./Sequence')(sequelize);
const Department = require('./Department')(sequelize);

// 定义关联关系
User.hasMany(Attendance, { foreignKey: 'user_id' });
Attendance.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Vehicle, { foreignKey: 'driver_id' });
Vehicle.belongsTo(User, { foreignKey: 'driver_id' });

Camera.hasMany(Alert, { foreignKey: 'camera_id' });
Alert.belongsTo(Camera, { foreignKey: 'camera_id' });

// User 与 Employee 的一对一关联关系
User.hasOne(Employee, { foreignKey: 'employee_id', sourceKey: 'employee_id' });
Employee.belongsTo(User, { foreignKey: 'employee_id', targetKey: 'employee_id' });

// 新的签到系统关联关系
Employee.hasMany(CheckIn, { foreignKey: 'employee_id', sourceKey: 'employee_id' });
CheckIn.belongsTo(Employee, { foreignKey: 'employee_id', targetKey: 'employee_id' });

Worksite.hasMany(CheckIn, { foreignKey: 'worksite_id', sourceKey: 'worksite_id' });
CheckIn.belongsTo(Worksite, { foreignKey: 'worksite_id', targetKey: 'worksite_id' });

// 员工与工地的多对多关系
Employee.belongsToMany(Worksite, { 
  through: 'employee_worksites', 
  foreignKey: 'employee_id', 
  otherKey: 'worksite_id',
  sourceKey: 'employee_id',
  targetKey: 'worksite_id'
});
Worksite.belongsToMany(Employee, { 
  through: 'employee_worksites', 
  foreignKey: 'worksite_id', 
  otherKey: 'employee_id',
  sourceKey: 'worksite_id',
  targetKey: 'employee_id'
});

// 签到记录关联
Employee.hasMany(CheckIn, { foreignKey: 'employee_id', sourceKey: 'employee_id' });
CheckIn.belongsTo(Employee, { foreignKey: 'employee_id', targetKey: 'employee_id' });

Worksite.hasMany(CheckIn, { foreignKey: 'worksite_id', sourceKey: 'worksite_id' });
CheckIn.belongsTo(Worksite, { foreignKey: 'worksite_id', targetKey: 'worksite_id' });

// QRCode 关联关系
Worksite.hasMany(QRCode, { foreignKey: 'worksite_id', sourceKey: 'worksite_id' });
QRCode.belongsTo(Worksite, { foreignKey: 'worksite_id', targetKey: 'worksite_id' });

// 证件关联
LicenseType.hasMany(EmployeeLicense, { foreignKey: 'license_type_id' });
EmployeeLicense.belongsTo(LicenseType, { foreignKey: 'license_type_id' });

Employee.hasMany(EmployeeLicense, { foreignKey: 'employee_id', sourceKey: 'employee_id' });
EmployeeLicense.belongsTo(Employee, { foreignKey: 'employee_id', targetKey: 'employee_id' });

// 部门关联关系
Department.hasMany(Employee, { foreignKey: 'department_id', as: 'employees' });
Employee.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

Department.belongsTo(Employee, { foreignKey: 'manager_id', as: 'manager' });
Department.belongsTo(Department, { foreignKey: 'parent_id', as: 'parent' });
Department.hasMany(Department, { foreignKey: 'parent_id', as: 'children' });

module.exports = {
  sequelize,
  User,
  Attendance,
  Vehicle,
  Camera,
  Alert,
  Employee,
  CheckIn,
  Worksite,
  QRCode,
  LicenseType,
  EmployeeLicense,
  LicenseReminderLog,
  Sequence,
  Department
};