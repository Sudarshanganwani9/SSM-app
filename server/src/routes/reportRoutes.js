const express = require('express');
const { attendanceReport, leaveReport, cofReport, employeeReport } = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('ADMIN'));

router.get('/attendance', attendanceReport);
router.get('/leaves', leaveReport);
router.get('/cof', cofReport);
router.get('/employees', employeeReport);

module.exports = router;
