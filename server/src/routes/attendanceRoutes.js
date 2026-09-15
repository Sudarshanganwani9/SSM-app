const express = require('express');
const {
  punchIn,
  punchOut,
  getTodayAttendance,
  getMyAttendance,
  getAllAttendance,
  updateAttendance,
  createAttendanceManually,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/punch-in', punchIn);
router.post('/punch-out', punchOut);
router.get('/today', getTodayAttendance);
router.get('/my', getMyAttendance);

router.get('/', authorize('ADMIN'), getAllAttendance);
router.post('/', authorize('ADMIN'), createAttendanceManually);
router.put('/:id', authorize('ADMIN'), updateAttendance);

module.exports = router;
