const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dateKey: { type: String, required: true, index: true }, // 'YYYY-MM-DD' in app timezone

    punchInAt: { type: Date, default: null },
    punchOutAt: { type: Date, default: null },

    punchInMeta: {
      ip: { type: String, default: '' },
      userAgent: { type: String, default: '' },
    },
    punchOutMeta: {
      ip: { type: String, default: '' },
      userAgent: { type: String, default: '' },
    },

    workingMinutes: { type: Number, default: 0 },

    status: {
      type: String,
      enum: [
        'PRESENT',
        'ABSENT',
        'LATE',
        'HALF_DAY',
        'LEAVE',
        'HOLIDAY',
        'WEEK_OFF',
        'PENDING_PUNCH_OUT',
        'WORK_FROM_HOME',
      ],
      default: 'PENDING_PUNCH_OUT',
      index: true,
    },

    halfDaySession: {
      type: String,
      enum: ['FIRST_HALF', 'SECOND_HALF', null],
      default: null,
    },

    remarks: { type: String, default: '' },

    // Set true when an Admin manually corrected this record
    correctedByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    correctionNote: { type: String, default: '' },

    // Links back to a leave, if this day's status derives from an approved leave
    relatedLeave: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Leave',
      default: null,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, dateKey: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
