const asyncHandler = require('express-async-handler');
const Leave = require('../models/Leave');
const LeaveType = require('../models/LeaveType');
const LeaveBalance = require('../models/LeaveBalance');
const Holiday = require('../models/Holiday');
const EmployeeProfile = require('../models/EmployeeProfile');
const ApiError = require('../utils/ApiError');
const { computeLeaveDays } = require('../utils/leaveDayCalculator');
const { getOfficeSettings } = require('../services/settingsService');
const leaveBalanceService = require('../services/leaveBalanceService');
const { notifyUser, notifyAllAdmins } = require('../services/notificationService');
const { recordAudit } = require('../services/auditService');
const { dateKey } = require('../utils/dateHelpers');

// ---------- Leave Types ----------

// GET /api/leave-types
const listLeaveTypes = asyncHandler(async (req, res) => {
  const includeInactive = req.user.role === 'ADMIN' && req.query.all === 'true';
  const query = includeInactive ? {} : { active: true };
  const types = await LeaveType.find(query).sort({ name: 1 });
  res.json({ success: true, data: types });
});

// POST /api/leave-types (Admin)
const createLeaveType = asyncHandler(async (req, res) => {
  const type = await LeaveType.create(req.body);
  res.status(201).json({ success: true, message: 'Leave type created.', data: type });
});

// PUT /api/leave-types/:id (Admin)
const updateLeaveType = asyncHandler(async (req, res) => {
  const type = await LeaveType.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!type) throw new ApiError(404, 'Leave type not found.');
  res.json({ success: true, message: 'Leave type updated.', data: type });
});

// DELETE /api/leave-types/:id (Admin) - soft delete (deactivate) to preserve history
const deleteLeaveType = asyncHandler(async (req, res) => {
  const type = await LeaveType.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!type) throw new ApiError(404, 'Leave type not found.');
  res.json({ success: true, message: 'Leave type deactivated.', data: type });
});

// ---------- Leave Balance ----------

// GET /api/leaves/balance/my
const getMyBalance = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const types = await LeaveType.find({ active: true });
  const balances = await Promise.all(
    types.map((t) => leaveBalanceService.getOrCreateBalance(req.user._id, t._id, year))
  );
  res.json({ success: true, data: balances });
});

// GET /api/leaves/balance/:employeeId (Admin)
const getEmployeeBalance = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const types = await LeaveType.find({ active: true });
  const balances = await Promise.all(
    types.map((t) => leaveBalanceService.getOrCreateBalance(req.params.employeeId, t._id, year))
  );
  res.json({ success: true, data: balances });
});

// PUT /api/leaves/balance/:employeeId (Admin) - configure totals
const setEmployeeBalance = asyncHandler(async (req, res) => {
  const { leaveType, year, totalDays } = req.body;
  const balance = await leaveBalanceService.getOrCreateBalance(req.params.employeeId, leaveType, year);
  const oldValue = balance.toObject();
  balance.totalDays = totalDays;
  await balance.save();

  await recordAudit({
    adminId: req.user._id,
    action: 'LEAVE_BALANCE_UPDATED',
    targetModel: 'LeaveBalance',
    targetId: balance._id,
    oldValue,
    newValue: balance.toObject(),
  });

  res.json({ success: true, message: 'Leave balance updated.', data: balance });
});

// ---------- Leave Requests ----------

// POST /api/leaves (Self - apply)
const applyLeave = asyncHandler(async (req, res) => {
  const { leaveType, startDate, endDate, isHalfDay, halfDaySession, reason, attachmentUrl } = req.body;

  const type = await LeaveType.findById(leaveType);
  if (!type || !type.active) throw new ApiError(400, 'Invalid leave type selected.');

  const start = new Date(startDate);
  const end = new Date(isHalfDay ? startDate : endDate);
  if (end < start) throw new ApiError(400, 'End date cannot be before start date.');
  if (isHalfDay && type.allowHalfDay === false) {
    throw new ApiError(400, `${type.name} does not support half-day requests.`);
  }
  if (type.requiresAttachment && !attachmentUrl) {
    throw new ApiError(400, `${type.name} requires an attachment.`);
  }

  const officeSettings = await getOfficeSettings();

  // Overlap check against existing PENDING/APPROVED leaves
  const overlap = await Leave.findOne({
    employee: req.user._id,
    status: { $in: ['PENDING', 'APPROVED'] },
    startDate: { $lte: end },
    endDate: { $gte: start },
  });
  if (overlap) {
    throw new ApiError(409, 'Your leave request overlaps with an existing leave.');
  }

  const holidays = await Holiday.find({ date: { $gte: start, $lte: end } }).select('date');
  const holidayDateKeys = new Set(holidays.map((h) => dateKey(h.date)));

  const numberOfDays = computeLeaveDays({
    startDate: start,
    endDate: end,
    isHalfDay: Boolean(isHalfDay),
    rules: officeSettings.leaveRules,
    holidayDateKeys,
  });

  if (numberOfDays <= 0) {
    throw new ApiError(400, 'The selected range contains no valid working days to apply leave for.');
  }

  const year = start.getFullYear();
  const balance = await leaveBalanceService.getOrCreateBalance(req.user._id, type._id, year);
  if (balance.remainingDays < numberOfDays) {
    throw new ApiError(
      400,
      `Insufficient leave balance. You have ${balance.remainingDays} ${type.name} day(s) remaining.`
    );
  }

  const leave = await Leave.create({
    employee: req.user._id,
    leaveType: type._id,
    startDate: start,
    endDate: end,
    isHalfDay: Boolean(isHalfDay),
    halfDaySession: isHalfDay ? halfDaySession : null,
    numberOfDays,
    reason,
    attachmentUrl: attachmentUrl || '',
    status: 'PENDING',
  });

  // Reserve as pending (does not deduct from usable balance until approved)
  await leaveBalanceService.reservePending(req.user._id, type._id, year, numberOfDays);

  await notifyAllAdmins({
    type: 'NEW_LEAVE_REQUEST',
    title: 'New leave request',
    message: `${req.user.fullName} applied for ${type.name} (${numberOfDays} day(s)).`,
    link: `/admin/leaves/${leave._id}`,
    relatedId: leave._id,
  });

  res.status(201).json({ success: true, message: 'Leave request submitted.', data: leave });
});

// GET /api/leaves/my (Self)
const getMyLeaves = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = { employee: req.user._id };
  if (status) query.status = status;
  const leaves = await Leave.find(query).populate('leaveType', 'name code').sort({ createdAt: -1 });
  res.json({ success: true, data: leaves });
});

// GET /api/leaves (Admin - all, filters)
const getAllLeaves = asyncHandler(async (req, res) => {
  const { status, employeeId, department, dateFrom, dateTo, page = 1, limit = 25 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (employeeId) query.employee = employeeId;
  if (dateFrom) query.startDate = { $gte: new Date(dateFrom) };
  if (dateTo) query.endDate = { ...(query.endDate || {}), $lte: new Date(dateTo) };

  if (department) {
    const profiles = await EmployeeProfile.find({ department }).select('user');
    query.employee = { $in: profiles.map((p) => p.user) };
  }

  const total = await Leave.countDocuments(query);
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));

  const leaves = await Leave.find(query)
    .populate('employee', 'fullName email employeeId')
    .populate('leaveType', 'name code')
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  res.json({
    success: true,
    data: leaves,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

// POST /api/leaves/:id/approve (Admin)
const approveLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id).populate('employee', 'fullName');
  if (!leave) throw new ApiError(404, 'Leave request not found.');
  if (leave.status !== 'PENDING') throw new ApiError(400, 'Only pending leave requests can be approved.');

  leave.status = 'APPROVED';
  leave.decidedBy = req.user._id;
  leave.decidedAt = new Date();
  leave.adminRemarks = req.body.adminRemarks || '';
  await leave.save();

  const year = leave.startDate.getFullYear();
  await leaveBalanceService.commitApproved(leave.employee._id, leave.leaveType, year, leave.numberOfDays);

  await notifyUser({
    recipientId: leave.employee._id,
    type: 'LEAVE_APPROVED',
    title: 'Leave approved',
    message: `Your leave request has been approved.`,
    link: '/employee/my-leaves',
    relatedId: leave._id,
  });

  await recordAudit({
    adminId: req.user._id,
    action: 'LEAVE_APPROVED',
    targetModel: 'Leave',
    targetId: leave._id,
    newValue: { status: 'APPROVED' },
  });

  res.json({ success: true, message: 'Leave approved.', data: leave });
});

// POST /api/leaves/:id/reject (Admin)
const rejectLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id).populate('employee', 'fullName');
  if (!leave) throw new ApiError(404, 'Leave request not found.');
  if (leave.status !== 'PENDING') throw new ApiError(400, 'Only pending leave requests can be rejected.');

  leave.status = 'REJECTED';
  leave.decidedBy = req.user._id;
  leave.decidedAt = new Date();
  leave.adminRemarks = req.body.adminRemarks || '';
  await leave.save();

  const year = leave.startDate.getFullYear();
  await leaveBalanceService.releasePending(leave.employee._id, leave.leaveType, year, leave.numberOfDays);

  await notifyUser({
    recipientId: leave.employee._id,
    type: 'LEAVE_REJECTED',
    title: 'Leave rejected',
    message: leave.adminRemarks
      ? `Your leave request was rejected: ${leave.adminRemarks}`
      : 'Your leave request was rejected.',
    link: '/employee/my-leaves',
    relatedId: leave._id,
  });

  await recordAudit({
    adminId: req.user._id,
    action: 'LEAVE_REJECTED',
    targetModel: 'Leave',
    targetId: leave._id,
    newValue: { status: 'REJECTED', adminRemarks: leave.adminRemarks },
  });

  res.json({ success: true, message: 'Leave rejected.', data: leave });
});

// POST /api/leaves/:id/cancel (Self - cancel own pending/approved-future leave)
const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave) throw new ApiError(404, 'Leave request not found.');
  if (String(leave.employee) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only cancel your own leave requests.');
  }
  if (!['PENDING', 'APPROVED'].includes(leave.status)) {
    throw new ApiError(400, 'Only pending or approved leaves can be cancelled.');
  }

  const year = leave.startDate.getFullYear();
  if (leave.status === 'PENDING') {
    await leaveBalanceService.releasePending(req.user._id, leave.leaveType, year, leave.numberOfDays);
  } else {
    await leaveBalanceService.reverseApproved(req.user._id, leave.leaveType, year, leave.numberOfDays);
  }

  leave.status = 'CANCELLED';
  await leave.save();

  await notifyAllAdmins({
    type: 'LEAVE_CANCELLED',
    title: 'Leave cancelled',
    message: `${req.user.fullName} cancelled a leave request.`,
    link: `/admin/leaves/${leave._id}`,
    relatedId: leave._id,
  });

  res.json({ success: true, message: 'Leave cancelled.', data: leave });
});

module.exports = {
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
};
