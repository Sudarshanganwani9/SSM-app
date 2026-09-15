const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
    },
    year: { type: Number, required: true, index: true },
    totalDays: { type: Number, required: true, default: 0 },
    usedDays: { type: Number, required: true, default: 0 },
    pendingDays: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

leaveBalanceSchema.index(
  { employee: 1, leaveType: 1, year: 1 },
  { unique: true }
);

leaveBalanceSchema.virtual('remainingDays').get(function remainingDays() {
  return this.totalDays - this.usedDays;
});

leaveBalanceSchema.set('toJSON', { virtuals: true });
leaveBalanceSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
