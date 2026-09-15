const mongoose = require('mongoose');

const officeSettingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: 'OFFICE_SETTINGS', unique: true },

    // Office timing (24h "HH:mm" strings, interpreted in APP_TIMEZONE)
    officeStartTime: { type: String, default: '09:30' },
    officeEndTime: { type: String, default: '18:30' },
    gracePeriodMinutes: { type: Number, default: 15 },
    minWorkingHoursForFullDay: { type: Number, default: 8 },
    halfDayThresholdHours: { type: Number, default: 4 },
    lateThresholdMinutes: { type: Number, default: 15 },

    // Leave rules
    leaveRules: {
      blockWeekendsInRange: { type: Boolean, default: true },
      blockHolidaysInRange: { type: Boolean, default: true },
      maxPastDaysForApplication: { type: Number, default: 2 },
    },

    // COF rules
    cofRules: {
      minSundayWorkingHours: { type: Number, default: 4 },
      requiresApproval: { type: Boolean, default: true },
      expiryDays: { type: Number, default: 90 },
    },

    notificationSettings: {
      inAppEnabled: { type: Boolean, default: true },
      emailEnabled: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OfficeSettings', officeSettingsSchema);
