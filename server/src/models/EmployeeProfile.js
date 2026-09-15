const mongoose = require('mongoose');

const employeeProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Personal details
    profilePhotoUrl: { type: String, default: '' },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },

    // Professional details
    department: { type: String, default: '' },
    designation: { type: String, default: '' },
    jobRole: { type: String, default: '' },
    fieldOfWork: { type: String, default: '' },
    dateOfJoining: { type: Date },
    employmentType: {
      type: String,
      enum: ['Full-Time', 'Part-Time', 'Contract', 'Intern', ''],
      default: '',
    },
    reportingManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Emergency contact
    emergencyContactName: { type: String, default: '' },
    emergencyContactRelationship: { type: String, default: '' },
    emergencyContactNumber: { type: String, default: '' },

    // Bank / payroll (optional, admin-controlled visibility)
    bankDetails: {
      accountHolderName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' },
      panNumber: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

employeeProfileSchema.index({ department: 1 });

module.exports = mongoose.model('EmployeeProfile', employeeProfileSchema);
