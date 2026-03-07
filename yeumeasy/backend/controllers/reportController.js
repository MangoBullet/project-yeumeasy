const reportService = require('../services/reportService');

exports.getBorrowReport = async (req, res, next) => {
  try {
    const report = await reportService.getBorrowReport(req.query);
    return res.json(report);
  } catch (error) {
    return next(error);
  }
};

exports.getTopEquipmentReport = async (req, res, next) => {
  try {
    const report = await reportService.getTopEquipmentReport(req.query);
    return res.json(report);
  } catch (error) {
    return next(error);
  }
};

exports.getReportDashboard = async (req, res, next) => {
  try {
    const dashboard = await reportService.getReportDashboard();
    return res.json(dashboard);
  } catch (error) {
    return next(error);
  }
};

