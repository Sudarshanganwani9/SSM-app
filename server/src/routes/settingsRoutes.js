const express = require('express');
const { getSettings, updateSettings, uploadLogo } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');
const { uploadCompanyLogo } = require('../middleware/upload');

const router = express.Router();
router.use(protect);

router.get('/', getSettings);
router.put('/', authorize('ADMIN'), updateSettings);
router.post('/logo', authorize('ADMIN'), uploadCompanyLogo.single('logo'), uploadLogo);

module.exports = router;
