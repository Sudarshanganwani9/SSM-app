const LeaveBalance = require('../models/LeaveBalance');
const LeaveType = require('../models/LeaveType');

/** Ensures a LeaveBalance row exists for employee/leaveType/year, creating from the type's default. */
async function getOrCreateBalance(employeeId, leaveTypeId, year) {
  let balance = await LeaveBalance.findOne({ employee: employeeId, leaveType: leaveTypeId, year });
  if (!balance) {
    const type = await LeaveType.findById(leaveTypeId);
    balance = await LeaveBalance.create({
      employee: employeeId,
      leaveType: leaveTypeId,
      year,
      totalDays: type ? type.defaultAnnualDays : 0,
      usedDays: 0,
      pendingDays: 0,
    });
  }
  return balance;
}

/** Reserve days as "pending" the moment a leave request is submitted (does NOT touch usedDays). */
async function reservePending(employeeId, leaveTypeId, year, days) {
  const balance = await getOrCreateBalance(employeeId, leaveTypeId, year);
  balance.pendingDays += days;
  await balance.save();
  return balance;
}

/** Release a pending reservation (on rejection/cancellation). */
async function releasePending(employeeId, leaveTypeId, year, days) {
  const balance = await getOrCreateBalance(employeeId, leaveTypeId, year);
  balance.pendingDays = Math.max(0, balance.pendingDays - days);
  await balance.save();
  return balance;
}

/** Move a reservation from pending -> used, on approval. */
async function commitApproved(employeeId, leaveTypeId, year, days) {
  const balance = await getOrCreateBalance(employeeId, leaveTypeId, year);
  balance.pendingDays = Math.max(0, balance.pendingDays - days);
  balance.usedDays += days;
  await balance.save();
  return balance;
}

/** Reverse a previously-approved leave (e.g. admin cancels an approved leave). */
async function reverseApproved(employeeId, leaveTypeId, year, days) {
  const balance = await getOrCreateBalance(employeeId, leaveTypeId, year);
  balance.usedDays = Math.max(0, balance.usedDays - days);
  await balance.save();
  return balance;
}

module.exports = {
  getOrCreateBalance,
  reservePending,
  releasePending,
  commitApproved,
  reverseApproved,
};
