const { Op } = require('sequelize');
const { User } = require('../models');

exports.getAll = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.max(parseInt(req.query.pageSize || '10', 10), 1);
    const search = (req.query.search || '').trim();

    const where = search
      ? {
          [Op.or]: [
            { full_name: { [Op.like]: `%${search}%` } },
            { student_id: { [Op.like]: `%${search}%` } }
          ]
        }
      : {};

    const { rows, count } = await User.findAndCountAll({
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
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const created = await User.create(req.body);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    return next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.update(req.body);
    return res.json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.destroy();
    return res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    return next(error);
  }
};
