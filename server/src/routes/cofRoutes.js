const express = require('express');
const { getMyCof, getAllCof, createCof, updateCof } = require('../controllers/cofController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/my', getMyCof);
router.get('/', authorize('ADMIN'), getAllCof);
router.post('/', authorize('ADMIN'), createCof);
router.put('/:id', authorize('ADMIN'), updateCof);

module.exports = router;
