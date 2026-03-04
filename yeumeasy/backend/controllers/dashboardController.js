const { Op } = require('sequelize');
const { User, Equipment, Borrow } = require('../models');

exports.getDashboard = async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [
      totalUsers,
      totalEquipment,
      totalActiveBorrow,
      totalOverdue,
      latestBorrows
    ] = await Promise.all([
      User.count(),
      Equipment.count(),
      Borrow.count({ where: { borrow_status: { [Op.ne]: 'returned' } } }),
      Borrow.count({
        where: {
          due_date: { [Op.lt]: today },
          borrow_status: { [Op.ne]: 'returned' }
        }
      }),
      Borrow.findAll({
        include: [{ model: User, as: 'user', attributes: ['id', 'full_name'] }],
        order: [['borrow_date', 'DESC']],
        limit: 5
      })
    ]);

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalEquipment,
        totalActiveBorrow,
        totalOverdue,
        latestBorrows
      }
    });
  } catch (error) {
    return next(error);
  }
};