const { DateTime } = require('luxon');

const APP_TZ = process.env.APP_TIMEZONE || 'Asia/Kolkata';

/** Current moment in the application timezone */
function nowInAppTz() {
  return DateTime.now().setZone(APP_TZ);
}

/** Returns a DateTime for an arbitrary JS Date/ISO string, in app timezone */
function toAppTz(value) {
  if (value instanceof Date) return DateTime.fromJSDate(value).setZone(APP_TZ);
  return DateTime.fromISO(value, { zone: APP_TZ }).setZone(APP_TZ);
}

/** Returns 'YYYY-MM-DD' for "today" in the application timezone */
function todayKey() {
  return nowInAppTz().toFormat('yyyy-LL-dd');
}

/** Returns 'YYYY-MM-DD' key for any date, in app timezone */
function dateKey(value) {
  return toAppTz(value).toFormat('yyyy-LL-dd');
}

/** Start-of-day (app tz) as a JS Date, for a given 'YYYY-MM-DD' key or Date */
function startOfDay(value) {
  const dt =
    typeof value === 'string'
      ? DateTime.fromFormat(value, 'yyyy-LL-dd', { zone: APP_TZ })
      : toAppTz(value);
  return dt.startOf('day').toJSDate();
}

function endOfDay(value) {
  const dt =
    typeof value === 'string'
      ? DateTime.fromFormat(value, 'yyyy-LL-dd', { zone: APP_TZ })
      : toAppTz(value);
  return dt.endOf('day').toJSDate();
}

/** true if the given date falls on a Sunday, in app timezone */
function isSunday(value) {
  return toAppTz(value).weekday === 7; // luxon: 1=Mon ... 7=Sun
}

/** Difference in minutes between two Date/ISO values */
function diffMinutes(start, end) {
  const s = toAppTz(start);
  const e = toAppTz(end);
  return Math.max(0, Math.round(e.diff(s, 'minutes').minutes));
}

/** Format minutes as "8h 46m" */
function formatDuration(totalMinutes) {
  if (totalMinutes == null || Number.isNaN(totalMinutes)) return '--';
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  return `${h}h ${m}m`;
}

/** Parse "HH:mm" office-setting time string against a given day, in app tz -> JS Date */
function timeOnDate(dayKeyStr, hhmm) {
  return DateTime.fromFormat(`${dayKeyStr} ${hhmm}`, 'yyyy-LL-dd HH:mm', {
    zone: APP_TZ,
  }).toJSDate();
}

module.exports = {
  APP_TZ,
  nowInAppTz,
  toAppTz,
  todayKey,
  dateKey,
  startOfDay,
  endOfDay,
  isSunday,
  diffMinutes,
  formatDuration,
  timeOnDate,
};
