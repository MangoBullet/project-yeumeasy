const express = require('express');
const controller = require('../controllers/equipmentController');
const { validateCreateEquipment, handleValidation } = require('../middleware/validators');

const router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validateCreateEquipment, handleValidation, controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
