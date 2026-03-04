const { Op } = require('sequelize');
const { Borrow, User, BorrowDetail, Equipment, sequelize } = require('../models');

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('At least one equipment item is required');
    error.status = 400;
    throw error;
  }

  const normalizedItemsMap = new Map();
  for (const item of items) {
    const equipmentId = Number(item.equipment_id);
    const amount = Number(item.amount);

    if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
      const error = new Error('Invalid equipment_id in items');
      error.status = 400;
      throw error;
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      const error = new Error('Each item amount must be a positive integer');
      error.status = 400;
      throw error;
    }

    normalizedItemsMap.set(equipmentId, (normalizedItemsMap.get(equipmentId) || 0) + amount);
  }

  return Array.from(normalizedItemsMap.entries()).map(([equipment_id, amount]) => ({
    equipment_id,
    amount
  }));
}

function getDisplayBorrowStatus(borrow, allReturned) {
  if (allReturned) return 'returned';
  const today = new Date().toISOString().slice(0, 10);
  if (borrow.due_date < today) return 'overdue';
  return 'borrowed';
}

exports.getAll = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.max(parseInt(req.query.pageSize || '10', 10), 1);
    const search = (req.query.search || '').trim();

    const includeUser = { model: User, as: 'user' };

    const where = search
      ? {
          [Op.or]: [
            { borrow_status: { [Op.like]: `%${search}%` } },
            { borrow_date: { [Op.like]: `%${search}%` } },
            { due_date: { [Op.like]: `%${search}%` } },
            { '$user.full_name$': { [Op.like]: `%${search}%` } },
            { '$user.student_id$': { [Op.like]: `%${search}%` } }
          ]
        }
      : {};

    const { rows, count } = await Borrow.findAndCountAll({
      where,
      include: [includeUser],
      order: [['borrow_date', 'DESC'], ['id', 'DESC']],
      offset: (page - 1) * pageSize,
      limit: pageSize,
      distinct: true,
      subQuery: false
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
    const borrow = await Borrow.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user' },
        {
          model: BorrowDetail,
          as: 'details',
          include: [{ model: Equipment, as: 'equipment' }]
        }
      ]
    });

    if (!borrow) {
      return res.status(404).json({ success: false, message: 'Borrow not found' });
    }

    return res.json({ success: true, data: borrow });
  } catch (error) {
    return next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { user_id, borrow_date, due_date, borrow_status = 'borrowed', items } = req.body;
    const normalizedItems = normalizeItems(items);

    const created = await sequelize.transaction(async (transaction) => {
      const borrow = await Borrow.create(
        { user_id, borrow_date, due_date, borrow_status },
        { transaction }
      );

      const equipmentIds = normalizedItems.map((item) => item.equipment_id);
      const equipmentRows = await Equipment.findAll({
        where: { id: equipmentIds },
        transaction
      });

      if (equipmentRows.length !== equipmentIds.length) {
        const error = new Error('One or more equipment items do not exist');
        error.status = 400;
        throw error;
      }

      const equipmentById = new Map(equipmentRows.map((row) => [row.id, row]));

      for (const item of normalizedItems) {
        const equipment = equipmentById.get(item.equipment_id);

        if (item.amount > Number(equipment.quantity)) {
          const error = new Error(
            `Insufficient stock for ${equipment.equipment_name}. Available: ${equipment.quantity}, requested: ${item.amount}`
          );
          error.status = 400;
          throw error;
        }
      }

      for (const item of normalizedItems) {
        const equipment = equipmentById.get(item.equipment_id);
        const updatedQuantity = Number(equipment.quantity) - item.amount;

        await BorrowDetail.create(
          {
            borrow_id: borrow.id,
            equipment_id: item.equipment_id,
            amount: item.amount,
            returned_amount: 0
          },
          { transaction }
        );

        await equipment.update(
          {
            quantity: updatedQuantity,
            status: updatedQuantity > 0 ? 'available' : 'out_of_stock'
          },
          { transaction }
        );
      }

      return borrow;
    });

    const borrowWithDetails = await Borrow.findByPk(created.id, {
      include: [
        { model: User, as: 'user' },
        {
          model: BorrowDetail,
          as: 'details',
          include: [{ model: Equipment, as: 'equipment' }]
        }
      ]
    });

    return res.status(201).json({ success: true, data: borrowWithDetails });
  } catch (error) {
    return next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const borrowId = Number(req.params.id);
    const { user_id, borrow_date, due_date, borrow_status = 'borrowed', items } = req.body;

    if (!Array.isArray(items)) {
      const borrow = await Borrow.findByPk(borrowId);
      if (!borrow) {
        return res.status(404).json({ success: false, message: 'Borrow not found' });
      }

      await borrow.update({ user_id, borrow_date, due_date, borrow_status });
      return res.json({ success: true, data: borrow });
    }

    const normalizedItems = normalizeItems(items);

    const updatedBorrowId = await sequelize.transaction(async (transaction) => {
      const borrow = await Borrow.findByPk(borrowId, {
        include: [{ model: BorrowDetail, as: 'details' }],
        transaction
      });

      if (!borrow) {
        const error = new Error('Borrow not found');
        error.status = 404;
        throw error;
      }

      const currentDetails = borrow.details || [];
      const existingEquipmentIds = currentDetails.map((detail) => Number(detail.equipment_id));
      const newEquipmentIds = normalizedItems.map((item) => Number(item.equipment_id));
      const allEquipmentIds = [...new Set([...existingEquipmentIds, ...newEquipmentIds])];

      const equipmentRows = await Equipment.findAll({
        where: { id: allEquipmentIds },
        transaction
      });

      if (equipmentRows.length !== allEquipmentIds.length) {
        const error = new Error('One or more equipment items do not exist');
        error.status = 400;
        throw error;
      }

      const equipmentById = new Map(equipmentRows.map((row) => [row.id, row]));

      for (const detail of currentDetails) {
        const equipment = equipmentById.get(Number(detail.equipment_id));
        equipment.quantity = Number(equipment.quantity) + Number(detail.amount);
      }

      for (const item of normalizedItems) {
        const equipment = equipmentById.get(item.equipment_id);
        if (item.amount > Number(equipment.quantity)) {
          const error = new Error(
            `Insufficient stock for ${equipment.equipment_name}. Available: ${equipment.quantity}, requested: ${item.amount}`
          );
          error.status = 400;
          throw error;
        }
      }

      await borrow.update(
        { user_id, borrow_date, due_date, borrow_status },
        { transaction }
      );

      await BorrowDetail.destroy({
        where: { borrow_id: borrow.id },
        transaction
      });

      for (const item of normalizedItems) {
        const equipment = equipmentById.get(item.equipment_id);
        equipment.quantity = Number(equipment.quantity) - Number(item.amount);

        await BorrowDetail.create(
          {
            borrow_id: borrow.id,
            equipment_id: item.equipment_id,
            amount: item.amount,
            returned_amount: 0
          },
          { transaction }
        );
      }

      for (const equipment of equipmentById.values()) {
        const quantity = Number(equipment.quantity);
        await equipment.update(
          {
            quantity,
            status: quantity > 0 ? 'available' : 'out_of_stock'
          },
          { transaction }
        );
      }

      return borrow.id;
    });

    const borrow = await Borrow.findByPk(updatedBorrowId, {
      include: [
        { model: User, as: 'user' },
        {
          model: BorrowDetail,
          as: 'details',
          include: [{ model: Equipment, as: 'equipment' }]
        }
      ]
    });

    return res.json({ success: true, data: borrow });
  } catch (error) {
    return next(error);
  }
};

exports.returnItems = async (req, res, next) => {
  try {
    const borrowId = Number(req.params.borrowId);
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one return item is required'
      });
    }

    const result = await sequelize.transaction(async (transaction) => {
      const borrow = await Borrow.findByPk(borrowId, {
        include: [
          {
            model: BorrowDetail,
            as: 'details',
            include: [{ model: Equipment, as: 'equipment' }]
          }
        ],
        transaction
      });

      if (!borrow) {
        const error = new Error('Borrow not found');
        error.status = 404;
        throw error;
      }

      const details = borrow.details || [];
      const detailMap = new Map(details.map((detail) => [Number(detail.id), detail]));

      for (const item of items) {
        const borrowDetailId = Number(item.borrowDetailId);
        const returnAmount = Number(item.returnAmount);

        if (!Number.isInteger(borrowDetailId) || borrowDetailId <= 0) {
          const error = new Error('Invalid borrowDetailId');
          error.status = 400;
          throw error;
        }

        if (!Number.isInteger(returnAmount) || returnAmount <= 0) {
          const error = new Error('returnAmount must be a positive integer');
          error.status = 400;
          throw error;
        }

        const detail = detailMap.get(borrowDetailId);
        if (!detail) {
          const error = new Error(`BorrowDetail ${borrowDetailId} not found for this borrow`);
          error.status = 400;
          throw error;
        }

        const remaining = Number(detail.amount) - Number(detail.returned_amount);
        if (returnAmount > remaining) {
          const error = new Error(
            `Return amount exceeds remaining quantity for ${detail.equipment ? detail.equipment.equipment_name : 'equipment'}`
          );
          error.status = 400;
          throw error;
        }

        const updatedReturnedAmount = Number(detail.returned_amount) + returnAmount;
        await detail.update({ returned_amount: updatedReturnedAmount }, { transaction });

        const equipment = await Equipment.findByPk(detail.equipment_id, { transaction });
        await equipment.update(
          {
            quantity: Number(equipment.quantity) + returnAmount,
            status: Number(equipment.quantity) + returnAmount > 0 ? 'available' : 'out_of_stock'
          },
          { transaction }
        );

        detail.returned_amount = updatedReturnedAmount;
      }

      const allReturned = details.length > 0 && details.every(
        (detail) => Number(detail.returned_amount) >= Number(detail.amount)
      );

      if (allReturned) {
        await borrow.update({ borrow_status: 'returned' }, { transaction });
      } else {
        await borrow.update({ borrow_status: 'borrowed' }, { transaction });
      }

      return {
        borrowStatus: getDisplayBorrowStatus(borrow, allReturned),
        allReturned
      };
    });

    return res.json({
      success: true,
      message: 'Items returned successfully',
      borrowStatus: result.borrowStatus
    });
  } catch (error) {
    return next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const borrow = await Borrow.findByPk(req.params.id);
    if (!borrow) {
      return res.status(404).json({ success: false, message: 'Borrow not found' });
    }

    await borrow.destroy();
    return res.json({ success: true, message: 'Borrow deleted' });
  } catch (error) {
    return next(error);
  }
};
