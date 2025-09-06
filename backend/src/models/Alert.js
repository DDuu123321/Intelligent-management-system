// src/models/Alert.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Alert = sequelize.define('Alert', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    alert_id: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('security', 'fire', 'intrusion', 'vehicle', 'system'),
      allowNull: false
    },
    level: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    camera_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'cameras',
        key: 'id'
      }
    },
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'vehicles',
        key: 'id'
      }
    },
    triggered_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'resolved', 'ignored'),
      defaultValue: 'active'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    }
  });

  return Alert;
};
