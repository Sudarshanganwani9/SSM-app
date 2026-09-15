const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const LeaveType = require('../models/LeaveType');
const Holiday = require('../models/Holiday');
const COF = require('../models/COF');
const Notification = require('../models/Notification');
const { todayKey, isSunday, nowInAppTz } = require('../utils/dateHelpers');
const leaveBalanceService = require('../services/leaveBalanceService');

// GET /api/dashboard/admin
const getAdminDashboard = asyncHandler(async (req, res) => {
  const dateKey = todayKey();
  const now = nowInAppTz();

  const activeEmployees = await User.find({ role: 'EMPLOYEE', status: 'ACTIVE' }).select('_id fullName');
  const activeIds = activeEmployees.map((e) => e._id);

  const [todaysAttendance, todaysHoliday, leavesToday] = await Promise.all([
    Attendance.find({ employee: { $in: activeIds }, dateKey }),
    Holiday.findOne({
      date: { $gte: now.startOf('day').toJSDate(), $lte: now.endOf('day').toJSDate() },
    }),
    Leave.find({
      employee: { $in: activeIds },
      status: 'APPROVED',
      startDate: { $lte: now.endOf('day').toJSDate() },
      endDate: { $gte: now.startOf('day').toJSDate() },
    }),
  ]);

  const attendanceByEmployee = new Map(todaysAttendance.map((a) => [String(a.employee), a]));
  const fullDayLeaveEmployees = new Set(
    leavesToday.filter((l) => !l.isHalfDay).map((l) => String(l.employee))
  );

  let present = 0;
  let late = 0;
  let halfDay = 0;
  let onLeave = 0;
  let absent = 0;
  const isWeekOffToday = isSunday(now.toJSDate());

  activeIds.forEach((id) => {
    const key = String(id);
    const record = attendanceByEmployee.get(key);
    if (record) {
      if (record.status === 'LATE') late += 1;
      if (['PRESENT', 'LATE', 'PENDING_PUNCH_OUT'].includes(record.status)) present += 1;
      if (record.status === 'HALF_DAY') halfDay += 1;
      if (record.status === 'LEAVE') onLeave += 1;
      return;
    }
    if (todaysHoliday || isWeekOffToday) return; // not counted as absent
    if (fullDayLeaveEmployees.has(key)) {
      onLeave += 1;
      return;
    }
    absent += 1;
  });

  const [
    pendingLeaveRequests,
    cofAvailable,
    upcomingHolidays,
    recentLeaveRequests,
    recentRegistrations,
  ] = await Promise.all([
    Leave.countDocuments({ status: 'PENDING' }),
    COF.countDocuments({ status: 'APPROVED' }),
    Holiday.find({ date: { $gte: now.startOf('day').toJSDate() } }).sort({ date: 1 }).limit(5),
    Leave.find().populate('employee', 'fullName employeeId').populate('leaveType', 'name').sort({ createdAt: -1 }).limit(5),
    User.find({ role: 'EMPLOYEE' }).sort({ createdAt: -1 }).limit(5).select('fullName email employeeId createdAt status'),
  ]);

  // Last 7 days attendance trend for the chart
  const last7 = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = now.minus({ days: i });
    const key = day.toFormat('yyyy-LL-dd');
    // eslint-disable-next-line no-await-in-loop
    const dayRecords = await Attendance.find({ dateKey: key, employee: { $in: activeIds } }).select('status');
    last7.push({
      date: key,
      present: dayRecords.filter((r) => ['PRESENT', 'LATE', 'PENDING_PUNCH_OUT', 'HALF_DAY'].includes(r.status)).length,
      absent: Math.max(0, activeIds.length - dayRecords.length),
    });
  }

  const leaveStatsAgg = await Leave.aggregate([
    { $match: { status: 'APPROVED' } },
    { $group: { _id: '$leaveType', totalDays: { $sum: '$numberOfDays' } } },
    { $lookup: { from: 'leavetypes', localField: '_id', foreignField: '_id', as: 'type' } },
    { $unwind: '$type' },
    { $project: { name: '$type.name', totalDays: 1, _id: 0 } },
  ]);

  res.json({
    success: true,
    data: {
      totals: {
        totalEmployees: activeEmployees.length,
        presentToday: present,
        absentToday: absent,
        onLeaveToday: onLeave,
        pendingLeaveRequests,
        lateEmployees: late,
        halfDayEmployees: halfDay,
        cofAvailable,
        upcomingHolidaysCount: upcomingHolidays.length,
      },
      upcomingHolidays,
      recentLeaveRequests,
      recentRegistrations,
      attendanceTrend: last7,
      leaveStatistics: leaveStatsAgg,
    },
  });
});

// GET /api/dashboard/employee
const getEmployeeDashboard = asyncHandler(async (req, res) => {
  const dateKey = todayKey();
  const year = new Date().getFullYear();

  const [todayAttendance, leaveTypes, pendingLeaveCount, upcomingHolidays, cofRecords, recentNotifications] =
    await Promise.all([
      Attendance.findOne({ employee: req.user._id, dateKey }),
      LeaveType.find({ active: true }),
      Leave.countDocuments({ employee: req.user._id, status: 'PENDING' }),
      Holiday.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5),
      COF.find({ employee: req.user._id }),
      Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(5),
    ]);

  const balances = await Promise.all(
    leaveTypes.map((t) => leaveBalanceService.getOrCreateBalance(req.user._id, t._id, year))
  );

  res.json({
    success: true,
    data: {
      profileCompleted: req.user.profileCompleted,
      todayAttendance,
      leaveBalances: balances,
      pendingLeaveCount,
      upcomingHolidays,
      cofAvailable: cofRecords.filter((c) => c.status === 'APPROVED').length,
      recentNotifications,
    },
  });
});

module.exports = { getAdminDashboard, getEmployeeDashboard };
