const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'LEAVE_APPROVED',
        'LEAVE_REJECTED',
        'LEAVE_CANCELLED',
        'NEW_LEAVE_REQUEST',
        'ATTENDANCE_ISSUE',
        'ATTENDANCE_CORRECTED',
        'COF_GENERATED',
        'COF_APPROVED',
        'COF_ADJUSTED',
        'COF_REQUIRES_APPROVAL',
        'HOLIDAY_ADDED',
        'HOLIDAY_UPDATED',
        'NEW_EMPLOYEE_REGISTRATION',
        'ADMIN_ANNOUNCEMENT',
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: '' },
    isRead: { type: Boolean, default: false, index: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
