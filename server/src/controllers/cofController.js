const asyncHandler = require('express-async-handler');
const COF = require('../models/COF');
const EmployeeProfile = require('../models/EmployeeProfile');
const ApiError = require('../utils/ApiError');
const { notifyUser } = require('../services/notificationService');
const { recordAudit } = require('../services/auditService');

// GET /api/cof/my (Self)
const getMyCof = asyncHandler(async (req, res) => {
  const records = await COF.find({ employee: req.user._id }).sort({ sundayDateWorked: -1 });
  const available = records.filter((r) => r.status === 'APPROVED').length;
  res.json({ success: true, data: records, availableCount: available });
});

// GET /api/cof (Admin) - filters
const getAllCof = asyncHandler(async (req, res) => {
  const { status, employeeId, department, page = 1, limit = 25 } = req.query;
  const query = {};
  if (status) query.status = status;
  if (employeeId) query.employee = employeeId;
  if (department) {
    const profiles = await EmployeeProfile.find({ department }).select('user');
    query.employee = { $in: profiles.map((p) => p.user) };
  }

  const total = await COF.countDocuments(query);
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));

  const records = await COF.find(query)
    .populate('employee', 'fullName email employeeId')
    .sort({ sundayDateWorked: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  res.json({
    success: true,
    data: records,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

// POST /api/cof (Admin) - manually create/award a COF record
const createCof = asyncHandler(async (req, res) => {
  const { employee, sundayDateWorked, workingMinutes, remarks, expiryDate } = req.body;
  const cof = await COF.create({
    employee,
    sundayDateWorked: new Date(sundayDateWorked),
    workingMinutes: workingMinutes || 0,
    status: 'APPROVED',
    decidedBy: req.user._id,
    decidedAt: new Date(),
    remarks: remarks || 'Manually awarded by Admin.',
    expiryDate: expiryDate ? new Date(expiryDate) : null,
  });

  await notifyUser({
    recipientId: employee,
    type: 'COF_APPROVED',
    title: 'Compensatory Off awarded',
    message: 'Admin has awarded you a Compensatory Off.',
    link: '/employee/cof',
    relatedId: cof._id,
  });

  res.status(201).json({ success: true, message: 'COF created.', data: cof });
});

// PUT /api/cof/:id (Admin) - approve / adjust / cancel / set expiry / remarks
const updateCof = asyncHandler(async (req, res) => {
  const cof = await COF.findById(req.params.id);
  if (!cof) throw new ApiError(404, 'COF record not found.');

  const oldValue = cof.toObject();
  const { status, expiryDate, remarks, workingMinutes } = req.body;

  if (status) {
    if (!['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'USED', 'CANCELLED', 'EXPIRED'].includes(status)) {
      throw new ApiError(400, 'Invalid COF status.');
    }
    cof.status = status;
    cof.decidedBy = req.user._id;
    cof.decidedAt = new Date();
  }
  if (expiryDate !== undefined) cof.expiryDate = expiryDate ? new Date(expiryDate) : null;
  if (remarks !== undefined) cof.remarks = remarks;
  if (workingMinutes !== undefined) cof.workingMinutes = workingMinutes;

  await cof.save();

  await recordAudit({
    adminId: req.user._id,
    action: 'COF_UPDATED',
    targetModel: 'COF',
    targetId: cof._id,
    oldValue,
    newValue: cof.toObject(),
  });

  if (status === 'APPROVED') {
    await notifyUser({
      recipientId: cof.employee,
      type: 'COF_APPROVED',
      title: 'Compensatory Off approved',
      message: 'Your Compensatory Off request has been approved.',
      link: '/employee/cof',
      relatedId: cof._id,
    });
  } else if (status) {
    await notifyUser({
      recipientId: cof.employee,
      type: 'COF_ADJUSTED',
      title: 'Compensatory Off updated',
      message: `Your Compensatory Off status was updated to ${status}.`,
      link: '/employee/cof',
      relatedId: cof._id,
    });
  }

  res.json({ success: true, message: 'COF updated.', data: cof });
});

module.exports = { getMyCof, getAllCof, createCof, updateCof };
