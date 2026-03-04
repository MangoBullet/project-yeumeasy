const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    full_name: { type: DataTypes.STRING, allowNull: false },
    student_id: { type: DataTypes.STRING, unique: true },
    phone: { type: DataTypes.STRING }
  },
  { tableName: 'users', timestamps: true }
);

module.exports = User;