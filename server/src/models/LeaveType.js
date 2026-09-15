const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    defaultAnnualDays: { type: Number, required: true, default: 0 },
    allowHalfDay: { type: Boolean, default: true },
    requiresAttachment: { type: Boolean, default: false },
    isPaid: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeaveType', leaveTypeSchema);
