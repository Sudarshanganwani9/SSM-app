const mongoose = require('mongoose');

const cofSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sundayDateWorked: { type: Date, required: true },
    sourceAttendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      default: null,
    },
    punchInAt: { type: Date },
    punchOutAt: { type: Date },
    workingMinutes: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'USED', 'CANCELLED', 'EXPIRED'],
      default: 'PENDING_APPROVAL',
      index: true,
    },

    generatedAt: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: null },

    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
    remarks: { type: String, default: '' },

    usedOnDate: { type: Date, default: null }, // when employee redeems the COF as a day off
  },
  { timestamps: true }
);

cofSchema.index({ employee: 1, sundayDateWorked: 1 }, { unique: true });

module.exports = mongoose.model('COF', cofSchema);
