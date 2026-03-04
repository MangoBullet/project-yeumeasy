const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BorrowDetail = sequelize.define(
  'BorrowDetail',
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    borrow_id: { type: DataTypes.INTEGER, allowNull: false },
    equipment_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.INTEGER, allowNull: false },
    returned_amount: { type: DataTypes.INTEGER, defaultValue: 0 }
  },
  {
    tableName: 'borrow_details',
    timestamps: true,
    indexes: [{ unique: true, fields: ['borrow_id', 'equipment_id'] }]
  }
);

module.exports = BorrowDetail;