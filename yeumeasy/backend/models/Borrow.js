const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Borrow = sequelize.define(
  'Borrow',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    borrow_date: { type: DataTypes.DATEONLY, allowNull: false },
    due_date: { type: DataTypes.DATEONLY, allowNull: false },
    borrow_status: { type: DataTypes.STRING, defaultValue: 'borrowed' }
  },
  { tableName: 'borrows', timestamps: true }
);

module.exports = Borrow;