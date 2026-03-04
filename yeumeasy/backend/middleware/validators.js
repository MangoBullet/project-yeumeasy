const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return next();
};

const validateCreateUser = [
  body('full_name').trim().notEmpty().withMessage('full_name is required'),
  body('student_id').trim().notEmpty().withMessage('student_id is required'),
  body('phone')
    .trim()
    .matches(/^\d{9,15}$/)
    .withMessage('phone must be a valid numeric string')
];

const validateCreateEquipment = [
  body('equipment_name').trim().notEmpty().withMessage('equipment_name is required'),
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('quantity must be an integer greater than or equal to 0')
];

const validateCreateBorrow = [
  body('user_id').isInt({ min: 1 }).withMessage('user_id is required'),
  body('borrow_date').isISO8601().withMessage('borrow_date is required and must be YYYY-MM-DD'),
  body('due_date')
    .isISO8601()
    .withMessage('due_date is required and must be YYYY-MM-DD')
    .custom((dueDate, { req }) => {
      if (!req.body.borrow_date) return true;
      if (new Date(dueDate) <= new Date(req.body.borrow_date)) {
        throw new Error('due_date must be after borrow_date');
      }
      return true;
    })
];

const validateReturnItems = [
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.borrowDetailId').isInt({ min: 1 }).withMessage('borrowDetailId must be a positive integer'),
  body('items.*.returnAmount').isInt({ min: 1 }).withMessage('returnAmount must be greater than 0')
];

module.exports = {
  handleValidation,
  validateCreateUser,
  validateCreateEquipment,
  validateCreateBorrow,
  validateReturnItems
};
