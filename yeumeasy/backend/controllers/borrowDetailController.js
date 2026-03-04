const { BorrowDetail, Borrow, Equipment } = require('../models');
const { recalculateBorrowStatus } = require('./helpers/borrowStatus');

exports.getAll = async (req, res, next) => {
  try {
    const rows = await BorrowDetail.findAll({
      include: [
        { model: Borrow, as: 'borrow' },
        { model: Equipment, as: 'equipment' }
      ],
      order: [['id', 'DESC']]
    });

    return res.json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const row = await BorrowDetail.findByPk(req.params.id, {
      include: [
        { model: Borrow, as: 'borrow' },
        { model: Equipment, as: 'equipment' }
      ]
    });

    if (!row) {
      return res.status(404).json({ success: false, message: 'Borrow detail not found' });
    }

    return res.json({ success: true, data: row });
  } catch (error) {
    return next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const created = await BorrowDetail.create(req.body);
    await recalculateBorrowStatus(created.borrow_id);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    return next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const row = await BorrowDetail.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Borrow detail not found' });
    }

    await row.update(req.body);
    await recalculateBorrowStatus(row.borrow_id);
    return res.json({ success: true, data: row });
  } catch (error) {
    return next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const row = await BorrowDetail.findByPk(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: 'Borrow detail not found' });
    }

    const borrowId = row.borrow_id;
    await row.destroy();
    await recalculateBorrowStatus(borrowId);

    return res.json({ success: true, message: 'Borrow detail deleted' });
  } catch (error) {
    return next(error);
  }
};