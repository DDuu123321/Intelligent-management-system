// src/models/Camera.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Camera = sequelize.define('Camera', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    camera_id: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    area: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    port: {
      type: DataTypes.INTEGER,
      defaultValue: 80
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    rtsp_url: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    position: {
      type: DataTypes.JSON,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('online', 'offline', 'maintenance'),
      defaultValue: 'offline'
    },
    is_recording: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    resolution: {
      type: DataTypes.STRING(20),
      defaultValue: '1920x1080'
    },
    fps: {
      type: DataTypes.INTEGER,
      defaultValue: 25
    },
    last_ping: {
      type: DataTypes.DATE,
      allowNull: true
    }
  });

  return Camera;
};