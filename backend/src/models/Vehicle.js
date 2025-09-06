// src/models/Vehicle.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Vehicle = sequelize.define('Vehicle', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    vehicle_id: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    plate_number: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    make: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    model: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    vin: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: true
    },
    driver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    current_location: {
      type: DataTypes.JSON,
      allowNull: true
    },
    speed: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    fuel_level: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    mileage: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('running', 'idle', 'maintenance', 'offline'),
      defaultValue: 'idle'
    },
    last_maintenance: {
      type: DataTypes.DATE,
      allowNull: true
    },
    next_maintenance: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_update: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  return Vehicle;
};