const express = require('express');
const controller = require('../controllers/reportController');

const router = express.Router();

router.get('/borrow', controller.getBorrowReport);
router.get('/top-equipment', controller.getTopEquipmentReport);

// Backward-compatible aliases
router.get('/borrow-summary', controller.getBorrowReport);
router.get('/borrow-by-date', controller.getBorrowReport);
router.get('/dashboard', controller.getReportDashboard);

module.exports = router;
