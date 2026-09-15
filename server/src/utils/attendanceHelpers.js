const { DateTime } = require('luxon');
const { APP_TZ, diffMinutes, timeOnDate } = require('./dateHelpers');

/**
 * Decide PRESENT / LATE / HALF_DAY / PENDING_PUNCH_OUT for a punch-in event,
 * based on the currently configured office settings.
 */
function statusOnPunchIn({ dateKey, punchInAt, officeSettings }) {
  const officeStart = timeOnDate(dateKey, officeSettings.officeStartTime);
  const lateThreshold = DateTime.fromJSDate(officeStart, { zone: APP_TZ })
    .plus({ minutes: officeSettings.lateThresholdMinutes })
    .toJSDate();

  const isLate = punchInAt.getTime() > lateThreshold.getTime();
  return isLate ? 'LATE' : 'PRESENT';
}

/**
 * Recompute final status/workingMinutes once punch-out happens (or when Admin
 * corrects a record), respecting half-day leave overlays if present.
 */
function computeFinalStatus({
  punchInAt,
  punchOutAt,
  officeSettings,
  wasLate,
  halfDaySession, // set if an approved half-day leave overlays this day
}) {
  if (!punchInAt || !punchOutAt) {
    return { status: 'PENDING_PUNCH_OUT', workingMinutes: 0 };
  }

  const workingMinutes = diffMinutes(punchInAt, punchOutAt);
  const workingHours = workingMinutes / 60;

  if (halfDaySession) {
    // Employee worked one half and is on approved leave for the other half.
    return { status: 'HALF_DAY', workingMinutes };
  }

  if (workingHours < officeSettings.halfDayThresholdHours) {
    return { status: 'HALF_DAY', workingMinutes };
  }

  if (
    workingHours < officeSettings.minWorkingHoursForFullDay &&
    workingHours >= officeSettings.halfDayThresholdHours
  ) {
    // Left early but did more than half-day threshold - still a valid full
    // present day per company policy, but flagged for review via remarks.
    return { status: wasLate ? 'LATE' : 'PRESENT', workingMinutes };
  }

  return { status: wasLate ? 'LATE' : 'PRESENT', workingMinutes };
}

module.exports = { statusOnPunchIn, computeFinalStatus };
