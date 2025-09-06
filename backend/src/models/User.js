// src/models/User.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employee_id: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    username: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    department: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'employee', 'driver'),
      defaultValue: 'employee'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    hire_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  return User;
};
