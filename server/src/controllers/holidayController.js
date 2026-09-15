const asyncHandler = require('express-async-handler');
const Holiday = require('../models/Holiday');
const ApiError = require('../utils/ApiError');
const { recordAudit } = require('../services/auditService');
const { notifyUser } = require('../services/notificationService');
const User = require('../models/User');

// GET /api/holidays (all authenticated users)
const listHolidays = asyncHandler(async (req, res) => {
  const { year, upcoming } = req.query;
  const query = {};
  if (year) {
    query.date = {
      $gte: new Date(`${year}-01-01T00:00:00.000Z`),
      $lte: new Date(`${year}-12-31T23:59:59.999Z`),
    };
  }
  if (upcoming === 'true') {
    query.date = { ...(query.date || {}), $gte: new Date() };
  }
  const holidays = await Holiday.find(query).sort({ date: 1 });
  res.json({ success: true, data: holidays });
});

// POST /api/holidays (Admin only)
const createHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.create({ ...req.body, createdBy: req.user._id });

  await recordAudit({
    adminId: req.user._id,
    action: 'HOLIDAY_CREATED',
    targetModel: 'Holiday',
    targetId: holiday._id,
    newValue: holiday.toObject(),
  });

  // Notify all active employees
  const employees = await User.find({ role: 'EMPLOYEE', status: 'ACTIVE' }).select('_id');
  await Promise.all(
    employees.map((e) =>
      notifyUser({
        recipientId: e._id,
        type: 'HOLIDAY_ADDED',
        title: 'New holiday added',
        message: `${holiday.name} has been added to the holiday calendar.`,
        link: '/employee/holidays',
        relatedId: holiday._id,
      })
    )
  );

  res.status(201).json({ success: true, message: 'Holiday created.', data: holiday });
});

// PUT /api/holidays/:id (Admin only)
const updateHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findById(req.params.id);
  if (!holiday) throw new ApiError(404, 'Holiday not found.');

  const oldValue = holiday.toObject();
  Object.assign(holiday, req.body);
  await holiday.save();

  await recordAudit({
    adminId: req.user._id,
    action: 'HOLIDAY_UPDATED',
    targetModel: 'Holiday',
    targetId: holiday._id,
    oldValue,
    newValue: holiday.toObject(),
  });

  res.json({ success: true, message: 'Holiday updated.', data: holiday });
});

// DELETE /api/holidays/:id (Admin only)
const deleteHoliday = asyncHandler(async (req, res) => {
  const holiday = await Holiday.findByIdAndDelete(req.params.id);
  if (!holiday) throw new ApiError(404, 'Holiday not found.');

  await recordAudit({
    adminId: req.user._id,
    action: 'HOLIDAY_DELETED',
    targetModel: 'Holiday',
    targetId: holiday._id,
    oldValue: holiday.toObject(),
  });

  res.json({ success: true, message: 'Holiday deleted.' });
});

module.exports = { listHolidays, createHoliday, updateHoliday, deleteHoliday };
