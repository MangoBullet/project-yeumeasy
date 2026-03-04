const express = require('express');
const controller = require('../controllers/userController');
const { validateCreateUser, handleValidation } = require('../middleware/validators');

const router = express.Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validateCreateUser, handleValidation, controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
