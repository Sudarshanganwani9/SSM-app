const asyncHandler = require('express-async-handler');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const EmployeeProfile = require('../models/EmployeeProfile');
const Leave = require('../models/Leave');
const ApiError = require('../utils/ApiError');
const { todayKey, isSunday } = require('../utils/dateHelpers');
const { statusOnPunchIn, computeFinalStatus } = require('../utils/attendanceHelpers');
const { getOfficeSettings } = require('../services/settingsService');
const { generateCofIfEligible } = require('../services/cofService');
const { recordAudit } = require('../services/auditService');
const { notifyAllAdmins } = require('../services/notificationService');

/** Finds an approved leave (if any) covering the given day for this employee. */
async function findApprovedLeaveForDay(employeeId, dateKeyStr) {
  const dayStart = new Date(`${dateKeyStr}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateKeyStr}T23:59:59.999Z`);
  return Leave.findOne({
    employee: employeeId,
    status: 'APPROVED',
    startDate: { $lte: dayEnd },
    endDate: { $gte: dayStart },
  });
}

// POST /api/attendance/punch-in
const punchIn = asyncHandler(async (req, res) => {
  const dateKey = todayKey();
  const officeSettings = await getOfficeSettings();

  let attendance = await Attendance.findOne({ employee: req.user._id, dateKey });
  if (attendance && attendance.punchInAt) {
    throw new ApiError(409, 'You have already punched in today.');
  }

  const approvedLeave = await findApprovedLeaveForDay(req.user._id, dateKey);
  let halfDaySession = null;
  if (approvedLeave) {
    if (approvedLeave.isHalfDay) {
      halfDaySession = approvedLeave.halfDaySession;
    } else {
      throw new ApiError(409, 'You are on approved leave today and cannot punch in.');
    }
  }

  const punchInAt = new Date();
  const status = statusOnPunchIn({ dateKey, punchInAt, officeSettings });

  const punchInMeta = { ip: req.ip || '', userAgent: req.headers['user-agent'] || '' };

  if (attendance) {
    attendance.punchInAt = punchInAt;
    attendance.punchInMeta = punchInMeta;
    attendance.status = 'PENDING_PUNCH_OUT';
    attendance.halfDaySession = halfDaySession;
    if (approvedLeave) attendance.relatedLeave = approvedLeave._id;
    await attendance.save();
  } else {
    attendance = await Attendance.create({
      employee: req.user._id,
      dateKey,
      punchInAt,
      punchInMeta,
      status: 'PENDING_PUNCH_OUT',
      halfDaySession,
      relatedLeave: approvedLeave ? approvedLeave._id : null,
    });
  }

  // Stash the "was late" fact for punch-out to reuse without recomputation.
  attendance._wasLate = status === 'LATE';

  res.status(201).json({
    success: true,
    message: 'Punched in successfully.',
    data: attendance,
  });
});

// POST /api/attendance/punch-out
const punchOut = asyncHandler(async (req, res) => {
  const dateKey = todayKey();
  const officeSettings = await getOfficeSettings();

  const attendance = await Attendance.findOne({ employee: req.user._id, dateKey });
  if (!attendance || !attendance.punchInAt) {
    throw new ApiError(400, 'You cannot punch out before punching in.');
  }
  if (attendance.punchOutAt) {
    throw new ApiError(409, 'You have already punched out today.');
  }

  const punchOutAt = new Date();
  const wasLate = attendance.status === 'LATE';

  const { status, workingMinutes } = computeFinalStatus({
    punchInAt: attendance.punchInAt,
    punchOutAt,
    officeSettings,
    wasLate,
    halfDaySession: attendance.halfDaySession,
  });

  attendance.punchOutAt = punchOutAt;
  attendance.punchOutMeta = { ip: req.ip || '', userAgent: req.headers['user-agent'] || '' };
  attendance.workingMinutes = workingMinutes;
  attendance.status = status;
  await attendance.save();

  // Sunday worked -> possible Compensatory Off
  if (isSunday(attendance.punchInAt)) {
    await generateCofIfEligible({ employee: req.user, attendance, officeSettings });
  }

  res.json({ success: true, message: 'Punched out successfully.', data: attendance });
});

// GET /api/attendance/today (Self) - convenience for dashboard widget
const getTodayAttendance = asyncHandler(async (req, res) => {
  const dateKey = todayKey();
  const attendance = await Attendance.findOne({ employee: req.user._id, dateKey });
  res.json({ success: true, data: attendance || null });
});

// GET /api/attendance/my (Self) - history with filters
const getMyAttendance = asyncHandler(async (req, res) => {
  const { month, year, status } = req.query;
  const query = { employee: req.user._id };

  if (year && month) {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    query.dateKey = { $regex: `^${prefix}` };
  } else if (year) {
    query.dateKey = { $regex: `^${year}` };
  }
  if (status) query.status = status;

  const records = await Attendance.find(query).sort({ dateKey: -1 });
  res.json({ success: true, data: records });
});

// GET /api/attendance (Admin) - all employees, filters + pagination
const getAllAttendance = asyncHandler(async (req, res) => {
  const {
    employeeId,
    department,
    status,
    dateFrom,
    dateTo,
    page = 1,
    limit = 25,
  } = req.query;

  const query = {};
  if (employeeId) query.employee = employeeId;
  if (status) query.status = status;
  if (dateFrom || dateTo) {
    query.dateKey = {};
    if (dateFrom) query.dateKey.$gte = dateFrom;
    if (dateTo) query.dateKey.$lte = dateTo;
  }

  let employeeFilter = {};
  if (department) {
    const profiles = await EmployeeProfile.find({ department }).select('user');
    query.employee = { $in: profiles.map((p) => p.user) };
  }

  const total = await Attendance.countDocuments(query);
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));

  const records = await Attendance.find(query)
    .populate('employee', 'fullName email employeeId')
    .sort({ dateKey: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  res.json({
    success: true,
    data: records,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

// PUT /api/attendance/:id (Admin) - correct punch in/out, mark status, add remarks
const updateAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.findById(req.params.id);
  if (!attendance) throw new ApiError(404, 'Attendance record not found.');

  const oldValue = attendance.toObject();
  const { punchInAt, punchOutAt, status, remarks } = req.body;

  if (punchInAt) attendance.punchInAt = new Date(punchInAt);
  if (punchOutAt) attendance.punchOutAt = new Date(punchOutAt);
  if (status) attendance.status = status;
  if (remarks !== undefined) attendance.remarks = remarks;

  if (attendance.punchInAt && attendance.punchOutAt) {
    const officeSettings = await getOfficeSettings();
    const { status: computed, workingMinutes } = computeFinalStatus({
      punchInAt: attendance.punchInAt,
      punchOutAt: attendance.punchOutAt,
      officeSettings,
      wasLate: false,
      halfDaySession: attendance.halfDaySession,
    });
    attendance.workingMinutes = workingMinutes;
    if (!status) attendance.status = computed; // don't override an explicit admin status choice
  }

  attendance.correctedByAdmin = req.user._id;
  attendance.correctionNote = req.body.correctionNote || attendance.correctionNote;
  await attendance.save();

  await recordAudit({
    adminId: req.user._id,
    action: 'ATTENDANCE_EDITED',
    targetModel: 'Attendance',
    targetId: attendance._id,
    oldValue,
    newValue: attendance.toObject(),
  });

  res.json({ success: true, message: 'Attendance updated.', data: attendance });
});

// POST /api/attendance (Admin) - manually create a record for a day with no punch data
const createAttendanceManually = asyncHandler(async (req, res) => {
  const { employee, dateKey, status, remarks, punchInAt, punchOutAt } = req.body;
  const user = await User.findById(employee);
  if (!user) throw new ApiError(404, 'Employee not found.');

  const existing = await Attendance.findOne({ employee, dateKey });
  if (existing) throw new ApiError(409, 'An attendance record already exists for this employee/date.');

  const attendance = await Attendance.create({
    employee,
    dateKey,
    status: status || 'PRESENT',
    remarks: remarks || '',
    punchInAt: punchInAt ? new Date(punchInAt) : null,
    punchOutAt: punchOutAt ? new Date(punchOutAt) : null,
    correctedByAdmin: req.user._id,
    correctionNote: 'Created manually by Admin.',
  });

  await recordAudit({
    adminId: req.user._id,
    action: 'ATTENDANCE_CREATED_MANUALLY',
    targetModel: 'Attendance',
    targetId: attendance._id,
    newValue: attendance.toObject(),
  });

  res.status(201).json({ success: true, message: 'Attendance record created.', data: attendance });
});

module.exports = {
  punchIn,
  punchOut,
  getTodayAttendance,
  getMyAttendance,
  getAllAttendance,
  updateAttendance,
  createAttendanceManually,
};
