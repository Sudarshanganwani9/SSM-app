const { DateTime } = require('luxon');
const { APP_TZ, isSunday } = require('./dateHelpers');

/**
 * Computes the number of leave days to deduct for a date range.
 * - Sunday is treated as the company's weekly off.
 * - Company holidays (passed in as a Set of 'yyyy-LL-dd' keys) are excluded
 *   from the day count when `rules.blockHolidaysInRange` is true.
 * - Half-day leave always spans a single date and counts as 0.5.
 */
function computeLeaveDays({ startDate, endDate, isHalfDay, rules, holidayDateKeys = new Set() }) {
  const start = DateTime.fromJSDate(startDate, { zone: APP_TZ }).startOf('day');
  const end = DateTime.fromJSDate(endDate, { zone: APP_TZ }).startOf('day');

  if (isHalfDay) {
    return 0.5;
  }

  let count = 0;
  let cursor = start;
  while (cursor <= end) {
    const key = cursor.toFormat('yyyy-LL-dd');
    const isWeekOff = rules.blockWeekendsInRange && isSunday(cursor.toJSDate());
    const isHoliday = rules.blockHolidaysInRange && holidayDateKeys.has(key);
    if (!isWeekOff && !isHoliday) count += 1;
    cursor = cursor.plus({ days: 1 });
  }
  return count;
}

module.exports = { computeLeaveDays };
