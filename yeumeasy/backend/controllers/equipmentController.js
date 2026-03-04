const { Op } = require('sequelize');
const { Equipment } = require('../models');

exports.getAll = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.max(parseInt(req.query.pageSize || '10', 10), 1);
    const search = (req.query.search || '').trim();

    const where = search
      ? {
          [Op.or]: [
            { equipment_name: { [Op.like]: `%${search}%` } },
            { category: { [Op.like]: `%${search}%` } },
            { status: { [Op.like]: `%${search}%` } }
          ]
        }
      : {};

    const { rows, count } = await Equipment.findAndCountAll({
      where,
      order: [['id', 'ASC']],
      offset: (page - 1) * pageSize,
      limit: pageSize
    });

    return res.json({
      success: true,
      data: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / pageSize) || 1,
        currentPage: page,
        pageSize
      }
    });
  } catch (error) {
    return next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    return res.json({ success: true, data: equipment });
  } catch (error) {
    return next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const created = await Equipment.create(req.body);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    return next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    await equipment.update(req.body);
    return res.json({ success: true, data: equipment });
  } catch (error) {
    return next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const equipment = await Equipment.findByPk(req.params.id);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    await equipment.destroy();
    return res.json({ success: true, message: 'Equipment deleted' });
  } catch (error) {
    return next(error);
  }
};
