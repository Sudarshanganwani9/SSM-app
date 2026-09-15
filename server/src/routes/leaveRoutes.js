const express = require('express');
const {
  listLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getMyBalance,
  getEmployeeBalance,
  setEmployeeBalance,
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave,
  cancelLeave,
} = require('../controllers/leaveController');
const { applyLeaveValidator, decideLeaveValidator } = require('../validators/leaveValidators');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { uploadLeaveAttachment } = require('../middleware/upload');

const router = express.Router();
router.use(protect);

// Leave types
router.get('/types', listLeaveTypes);
router.post('/types', authorize('ADMIN'), createLeaveType);
router.put('/types/:id', authorize('ADMIN'), updateLeaveType);
router.delete('/types/:id', authorize('ADMIN'), deleteLeaveType);

// Balances
router.get('/balance/my', getMyBalance);
router.get('/balance/:employeeId', authorize('ADMIN'), getEmployeeBalance);
router.put('/balance/:employeeId', authorize('ADMIN'), setEmployeeBalance);

// Attachment upload helper (returns a URL to include in the applyLeave payload)
router.post('/attachment', uploadLeaveAttachment.single('attachment'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
  res.status(201).json({ success: true, data: { url: `/uploads/leave-attachments/${req.file.filename}` } });
});

// Requests
router.post('/', applyLeaveValidator, validate, applyLeave);
router.get('/my', getMyLeaves);
router.get('/', authorize('ADMIN'), getAllLeaves);
router.post('/:id/approve', authorize('ADMIN'), decideLeaveValidator, validate, approveLeave);
router.post('/:id/reject', authorize('ADMIN'), decideLeaveValidator, validate, rejectLeave);
router.post('/:id/cancel', cancelLeave);

module.exports = router;
