const { Op, fn, col, literal } = require('sequelize');
const { Borrow, BorrowDetail, Equipment, User } = require('../models');

function isValidDay(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const [year, month, date] = day.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, date));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === date
  );
}

function isValidMonth(month) {
  if (!/^\d{4}-\d{2}$/.test(month)) return false;
  const [year, monthNumber] = month.split('-').map(Number);
  return monthNumber >= 1 && monthNumber <= 12 && year >= 1900 && year <= 9999;
}

function getMonthRange(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const start = `${year}-${String(monthNumber).padStart(2, '0')}-01`;
  const endDate = new Date(Date.UTC(year, monthNumber, 0));
  const end = `${year}-${String(monthNumber).padStart(2, '0')}-${String(endDate.getUTCDate()).padStart(2, '0')}`;
  return { start, end };
}

function toDateOnly(value) {
  return new Date(value).toISOString().slice(0, 10);
}

exports.borrowSummary = async (req, res, next) => {
  try {
    const { day, month } = req.query;

    if (!day && !month) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either day (YYYY-MM-DD) or month (YYYY-MM)'
      });
    }

    if (day && month) {
      return res.status(400).json({
        success: false,
        message: 'Provide only one filter: day or month'
      });
    }

    if (day && !isValidDay(day)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day format. Use YYYY-MM-DD'
      });
    }

    if (month && !isValidMonth(month)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month format. Use YYYY-MM'
      });
    }

    const range = day ? { start: day, end: day } : getMonthRange(month);

    const borrows = await Borrow.findAll({
      where: {
        borrow_date: { [Op.between]: [range.start, range.end] }
      },
      include: [
        { model: User, as: 'user', attributes: ['id', 'full_name'] },
        { model: BorrowDetail, as: 'details', attributes: ['id', 'amount', 'returned_amount'] }
      ],
      order: [['borrow_date', 'ASC'], ['id', 'ASC']]
    });

    const transactions = borrows.map((borrow) => {
      const totalAmount = (borrow.details || []).reduce((sum, detail) => sum + Number(detail.amount || 0), 0);
      const fullyReturned =
        (borrow.details || []).length > 0 &&
        (borrow.details || []).every((detail) => Number(detail.returned_amount) >= Number(detail.amount));

      return {
        user: borrow.user ? borrow.user.full_name : null,
        totalAmount,
        borrowDate: borrow.borrow_date,
        startDate: borrow.borrow_date,
        returnDate: fullyReturned ? toDateOnly(borrow.updatedAt) : borrow.due_date
      };
    });

    if (day) {
      return res.json({
        success: true,
        filter: day,
        totalTransactions: transactions.length,
        data: transactions
      });
    }

    const groupedMap = transactions.reduce((acc, item) => {
      if (!acc[item.borrowDate]) acc[item.borrowDate] = [];
      acc[item.borrowDate].push(item);
      return acc;
    }, {});

    const groupedData = Object.keys(groupedMap)
      .sort()
      .map((date) => ({
        date,
        totalTransactions: groupedMap[date].length,
        transactions: groupedMap[date]
      }));

    return res.json({
      success: true,
      filter: month,
      totalTransactions: transactions.length,
      data: groupedData
    });
  } catch (error) {
    return next(error);
  }
};

exports.topEquipment = async (req, res, next) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({
        success: false,
        message: 'Month filter is required (YYYY-MM)'
      });
    }

    if (!isValidMonth(month)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month format. Use YYYY-MM'
      });
    }

    const range = getMonthRange(month);

    const rows = await BorrowDetail.findAll({
      attributes: [
        'equipment_id',
        [fn('COUNT', col('borrow_id')), 'totalTimes'],
        [fn('SUM', col('amount')), 'totalQuantity']
      ],
      include: [
        {
          model: Borrow,
          as: 'borrow',
          attributes: [],
          where: {
            borrow_date: { [Op.between]: [range.start, range.end] }
          },
          required: true
        },
        {
          model: Equipment,
          as: 'equipment',
          attributes: ['id', 'equipment_name']
        }
      ],
      group: ['equipment_id', 'equipment.id'],
      order: [[literal('totalQuantity'), 'DESC']],
      limit: 5
    });

    const topEquipment = rows.map((row) => ({
      equipment_name: row.equipment ? row.equipment.equipment_name : null,
      totalTimes: Number(row.get('totalTimes') || 0),
      totalQuantity: Number(row.get('totalQuantity') || 0)
    }));

    return res.json({
      success: true,
      month,
      topEquipment
    });
  } catch (error) {
    return next(error);
  }
};

exports.dashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalEquipment,
      totalBorrows,
      currentlyBorrowed,
      topEquipment,
      lastTransactions
    ] = await Promise.all([
      User.count(),
      Equipment.count(),
      Borrow.count(),
      Borrow.count({ where: { borrow_status: 'borrowed' } }),
      BorrowDetail.findAll({
        attributes: ['equipment_id', [fn('SUM', col('amount')), 'total_borrowed']],
        include: [{ model: Equipment, as: 'equipment', attributes: ['id', 'equipment_name'] }],
        group: ['equipment_id', 'equipment.id'],
        order: [[literal('total_borrowed'), 'DESC']],
        limit: 5
      }),
      Borrow.findAll({
        include: [{ model: User, as: 'user', attributes: ['id', 'full_name'] }],
        order: [['createdAt', 'DESC']],
        limit: 5
      })
    ]);

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalEquipment,
        totalBorrows,
        currentlyBorrowed,
        topEquipment,
        lastTransactions
      }
    });
  } catch (error) {
    return next(error);
  }
};
