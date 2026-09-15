const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true, index: true },
    type: {
      type: String,
      enum: ['NATIONAL', 'REGIONAL', 'COMPANY', 'OPTIONAL'],
      default: 'COMPANY',
    },
    description: { type: String, default: '' },
    iconUrl: { type: String, default: '' },
    isRecurringYearly: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Holiday', holidaySchema);
