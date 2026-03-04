const sequelize = require('../config/database');
const User = require('./User');
const Equipment = require('./Equipment');
const Borrow = require('./Borrow');
const BorrowDetail = require('./BorrowDetail');

User.hasMany(Borrow, { foreignKey: 'user_id', as: 'borrows' });
Borrow.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Borrow.hasMany(BorrowDetail, { foreignKey: 'borrow_id', as: 'details', onDelete: 'CASCADE' });
BorrowDetail.belongsTo(Borrow, { foreignKey: 'borrow_id', as: 'borrow' });

Equipment.hasMany(BorrowDetail, { foreignKey: 'equipment_id', as: 'borrowDetails' });
BorrowDetail.belongsTo(Equipment, { foreignKey: 'equipment_id', as: 'equipment' });

Borrow.belongsToMany(Equipment, {
  through: BorrowDetail,
  foreignKey: 'borrow_id',
  otherKey: 'equipment_id',
  as: 'equipmentItems'
});

Equipment.belongsToMany(Borrow, {
  through: BorrowDetail,
  foreignKey: 'equipment_id',
  otherKey: 'borrow_id',
  as: 'borrowTransactions'
});

module.exports = {
  sequelize,
  User,
  Equipment,
  Borrow,
  BorrowDetail
};