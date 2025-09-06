// src/models/Sequence.js
module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  const Sequence = sequelize.define('Sequence', {
    key: { type: DataTypes.STRING, primaryKey: true },
    value: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, {
    tableName: 'sequences',
    timestamps: false,
    underscored: true
  });
  return Sequence;
};
