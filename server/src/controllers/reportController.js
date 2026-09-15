const asyncHandler = require('express-async-handler');
const { Parser } = require('json2csv');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const COF = require('../models/COF');
const User = require('../models/User');
const EmployeeProfile = require('../models/EmployeeProfile');
const { formatDuration } = require('../utils/dateHelpers');

function respondWithData(req, res, rows, fields, filenamePrefix) {
  if (req.query.format === 'csv') {
    const parser = new Parser({ fields });
    const csv = parser.parse(rows);
    res.header('Content-Type', 'text/csv');
    res.attachment(`${filenamePrefix}-${Date.now()}.csv`);
    return res.send(csv);
  }
  return res.json({ success: true, data: rows });
}

async function departmentUserIds(department) {
  if (!department) return null;
  const profiles = await EmployeeProfile.find({ department }).select('user');
  return profiles.map((p) => p.user);
}

// GET /api/reports/attendance
const attendanceReport = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, employeeId, department, status } = req.query;
  const query = {};
  if (dateFrom || dateTo) {
    query.dateKey = {};
    if (dateFrom) query.dateKey.$gte = dateFrom;
    if (dateTo) query.dateKey.$lte = dateTo;
  }
  if (employeeId) query.employee = employeeId;
  if (status) query.status = status;

  const deptIds = await departmentUserIds(department);
  if (deptIds) query.employee = query.employee ? query.employee : { $in: deptIds };

  const records = await Attendance.find(query).populate('employee', 'fullName email employeeId').sort({ dateKey: -1 });

  const rows = records.map((r) => ({
    Employee: r.employee?.fullName || '',
    EmployeeId: r.employee?.employeeId || '',
    Date: r.dateKey,
    PunchIn: r.punchInAt ? r.punchInAt.toISOString() : '',
    PunchOut: r.punchOutAt ? r.punchOutAt.toISOString() : '',
    WorkingHours: formatDuration(r.workingMinutes),
    Status: r.status,
  }));

  respondWithData(req, res, rows, ['Employee', 'EmployeeId', 'Date', 'PunchIn', 'PunchOut', 'WorkingHours', 'Status'], 'attendance-report');
});

// GET /api/reports/leaves
const leaveReport = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, employeeId, status } = req.query;
  const query = {};
  if (dateFrom) query.startDate = { $gte: new Date(dateFrom) };
  if (dateTo) query.endDate = { $lte: new Date(dateTo) };
  if (employeeId) query.employee = employeeId;
  if (status) query.status = status;

  const records = await Leave.find(query)
    .populate('employee', 'fullName employeeId')
    .populate('leaveType', 'name')
    .sort({ startDate: -1 });

  const rows = records.map((r) => ({
    Employee: r.employee?.fullName || '',
    EmployeeId: r.employee?.employeeId || '',
    LeaveType: r.leaveType?.name || '',
    StartDate: r.startDate.toISOString().slice(0, 10),
    EndDate: r.endDate.toISOString().slice(0, 10),
    Days: r.numberOfDays,
    Status: r.status,
  }));

  respondWithData(req, res, rows, ['Employee', 'EmployeeId', 'LeaveType', 'StartDate', 'EndDate', 'Days', 'Status'], 'leave-report');
});

// GET /api/reports/cof
const cofReport = asyncHandler(async (req, res) => {
  const { dateFrom, dateTo, employeeId, status } = req.query;
  const query = {};
  if (dateFrom) query.sundayDateWorked = { $gte: new Date(dateFrom) };
  if (dateTo) query.sundayDateWorked = { ...(query.sundayDateWorked || {}), $lte: new Date(dateTo) };
  if (employeeId) query.employee = employeeId;
  if (status) query.status = status;

  const records = await COF.find(query).populate('employee', 'fullName employeeId').sort({ sundayDateWorked: -1 });

  const rows = records.map((r) => ({
    Employee: r.employee?.fullName || '',
    EmployeeId: r.employee?.employeeId || '',
    SundayWorked: r.sundayDateWorked.toISOString().slice(0, 10),
    Hours: (r.workingMinutes / 60).toFixed(2),
    Status: r.status,
    Expiry: r.expiryDate ? r.expiryDate.toISOString().slice(0, 10) : '',
  }));

  respondWithData(req, res, rows, ['Employee', 'EmployeeId', 'SundayWorked', 'Hours', 'Status', 'Expiry'], 'cof-report');
});

// GET /api/reports/employees
const employeeReport = asyncHandler(async (req, res) => {
  const { department, status } = req.query;
  const userQuery = { role: 'EMPLOYEE' };
  if (status) userQuery.status = status;

  const users = await User.find(userQuery).lean();
  const profileFilter = { user: { $in: users.map((u) => u._id) } };
  if (department) profileFilter.department = department;
  const profiles = await EmployeeProfile.find(profileFilter).lean();
  const profileByUser = new Map(profiles.map((p) => [String(p.user), p]));

  const rows = users
    .filter((u) => !department || profileByUser.has(String(u._id)))
    .map((u) => {
      const p = profileByUser.get(String(u._id));
      return {
        EmployeeId: u.employeeId || '',
        Name: u.fullName,
        Email: u.email,
        Department: p?.department || '',
        Designation: p?.designation || '',
        JoiningDate: p?.dateOfJoining ? new Date(p.dateOfJoining).toISOString().slice(0, 10) : '',
        Status: u.status,
      };
    });

  respondWithData(req, res, rows, ['EmployeeId', 'Name', 'Email', 'Department', 'Designation', 'JoiningDate', 'Status'], 'employee-report');
});

module.exports = { attendanceReport, leaveReport, cofReport, employeeReport };
