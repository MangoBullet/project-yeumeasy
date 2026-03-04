const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Equipment = sequelize.define(
  'Equipment',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    equipment_name: { type: DataTypes.STRING, allowNull: false },
    category: { type: DataTypes.STRING },
    quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
    status: { type: DataTypes.STRING, defaultValue: 'available' }
  },
  { tableName: 'equipment', timestamps: true }
);

module.exports = Equipment;