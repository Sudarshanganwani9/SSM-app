const express = require('express');
const { listHolidays, createHoliday, updateHoliday, deleteHoliday } = require('../controllers/holidayController');
const { holidayValidator } = require('../validators/holidayValidators');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { uploadHolidayIcon } = require('../middleware/upload');

const router = express.Router();
router.use(protect);

router.get('/', listHolidays);
router.post('/', authorize('ADMIN'), holidayValidator, validate, createHoliday);
router.put('/:id', authorize('ADMIN'), updateHoliday);
router.delete('/:id', authorize('ADMIN'), deleteHoliday);
router.post('/icon', authorize('ADMIN'), uploadHolidayIcon.single('icon'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  res.status(201).json({ success: true, data: { url: `/uploads/holiday-icons/${req.file.filename}` } });
});

module.exports = router;
