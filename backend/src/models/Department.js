// src/models/Department.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Department = sequelize.define('Department', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '部门名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '部门描述'
    },
    manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'employees',
        key: 'id'
      },
      comment: '部门主管ID'
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      },
      comment: '上级部门ID'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否启用'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    }
  }, {
    tableName: 'departments',
    timestamps: true,
    paranoid: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['parent_id'] },
      { fields: ['manager_id'] },
      { fields: ['is_active'] }
    ]
  });

  Department.associate = function(models) {
    // 部门有多个员工
    Department.hasMany(models.Employee, {
      foreignKey: 'department_id',
      as: 'employees'
    });
    
    // 部门有一个主管
    Department.belongsTo(models.Employee, {
      foreignKey: 'manager_id',
      as: 'manager'
    });
    
    // 自关联：上级部门
    Department.belongsTo(models.Department, {
      foreignKey: 'parent_id',
      as: 'parent'
    });
    
    // 自关联：下级部门
    Department.hasMany(models.Department, {
      foreignKey: 'parent_id',
      as: 'children'
    });
  };

  return Department;
};