const express = require('express');
const { protect, adminOnly } = require('../middleware/auth');
const {
	getDashboardStats,
	getMonthlyReports,
	downloadMonthlyReportsCsv
} = require('../controllers/adminController');

const router = express.Router();

router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.get('/reports/monthly', protect, adminOnly, getMonthlyReports);
router.get('/reports/monthly.csv', protect, adminOnly, downloadMonthlyReportsCsv);

module.exports = router;
