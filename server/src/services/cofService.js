const { DateTime } = require('luxon');
const COF = require('../models/COF');
const { APP_TZ } = require('../utils/dateHelpers');
const { notifyUser, notifyAllAdmins } = require('./notificationService');

/**
 * Rule (configurable via OfficeSettings.cofRules):
 * If an employee punches in+out on a Sunday and completes at least
 * `minSundayWorkingHours`, generate one Compensatory Off record.
 * If `requiresApproval` is false, it is auto-approved; otherwise it starts
 * PENDING_APPROVAL and admins are notified.
 */
async function generateCofIfEligible({ employee, attendance, officeSettings }) {
  const workingHours = attendance.workingMinutes / 60;
  if (workingHours < officeSettings.cofRules.minSundayWorkingHours) {
    return null;
  }

  const existing = await COF.findOne({
    employee: employee._id,
    sundayDateWorked: new Date(`${attendance.dateKey}T00:00:00.000Z`),
  });
  if (existing) return existing;

  const requiresApproval = officeSettings.cofRules.requiresApproval;
  const generatedAt = new Date();
  const expiryDays = officeSettings.cofRules.expiryDays;
  const expiryDate = expiryDays
    ? DateTime.fromJSDate(generatedAt, { zone: APP_TZ }).plus({ days: expiryDays }).toJSDate()
    : null;

  const cof = await COF.create({
    employee: employee._id,
    sundayDateWorked: new Date(`${attendance.dateKey}T00:00:00.000Z`),
    sourceAttendance: attendance._id,
    punchInAt: attendance.punchInAt,
    punchOutAt: attendance.punchOutAt,
    workingMinutes: attendance.workingMinutes,
    status: requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED',
    expiryDate,
    decidedAt: requiresApproval ? null : generatedAt,
  });

  await notifyUser({
    recipientId: employee._id,
    type: 'COF_GENERATED',
    title: 'Compensatory Off generated',
    message: `You earned a Compensatory Off for working on Sunday, ${attendance.dateKey}.`,
    link: '/employee/cof',
    relatedId: cof._id,
  });

  if (requiresApproval) {
    await notifyAllAdmins({
      type: 'COF_REQUIRES_APPROVAL',
      title: 'COF awaiting approval',
      message: `${employee.fullName} earned a Compensatory Off for Sunday ${attendance.dateKey} that needs approval.`,
      link: '/admin/cof',
      relatedId: cof._id,
    });
  }

  return cof;
}

module.exports = { generateCofIfEligible };
