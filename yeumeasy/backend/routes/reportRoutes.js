const express = require('express');
const controller = require('../controllers/reportController');

const router = express.Router();

router.get('/borrow-summary', controller.borrowSummary);
router.get('/borrow-by-date', controller.borrowSummary);
router.get('/top-equipment', controller.topEquipment);
router.get('/dashboard', controller.dashboard);

module.exports = router;
