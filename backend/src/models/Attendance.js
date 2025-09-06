// src/models/Attendance.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Attendance = sequelize.define('Attendance', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    check_in: {
      type: DataTypes.TIME,
      allowNull: true
    },
    check_out: {
      type: DataTypes.TIME,
      allowNull: true
    },
    check_in_location: {
      type: DataTypes.JSON,
      allowNull: true
    },
    check_out_location: {
      type: DataTypes.JSON,
      allowNull: true
    },
    work_hours: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('present', 'late', 'absent', 'leave', 'holiday'),
      defaultValue: 'present'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  return Attendance;
};
