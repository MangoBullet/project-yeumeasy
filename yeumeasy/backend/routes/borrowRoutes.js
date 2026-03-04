const express = require('express');
const controller = require('../controllers/borrowController');
const {
  validateCreateBorrow,
  validateReturnItems,
  handleValidation
} = require('../middleware/validators');

const router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validateCreateBorrow, handleValidation, controller.create);
router.put('/:borrowId/return', validateReturnItems, handleValidation, controller.returnItems);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
