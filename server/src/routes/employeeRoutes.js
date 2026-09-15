const express = require('express');
const {
  listEmployees,
  getEmployeeById,
  getMyProfile,
  updateMyProfile,
  uploadMyProfilePhoto,
  updateEmployeeByAdmin,
  setEmployeeStatus,
  resetEmployeePassword,
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');
const { uploadProfilePhoto } = require('../middleware/upload');

const router = express.Router();

router.use(protect);

// Self-service (must be BEFORE the /:id routes so 'me' isn't parsed as an id)
router.get('/me/profile', getMyProfile);
router.put('/me/profile', updateMyProfile);
router.post('/me/photo', uploadProfilePhoto.single('photo'), uploadMyProfilePhoto);

// Admin employee management
router.get('/', authorize('ADMIN'), listEmployees);
router.get('/:id', authorize('ADMIN'), getEmployeeById);
router.put('/:id', authorize('ADMIN'), updateEmployeeByAdmin);
router.patch('/:id/status', authorize('ADMIN'), setEmployeeStatus);
router.post('/:id/reset-password', authorize('ADMIN'), resetEmployeePassword);

module.exports = router;
