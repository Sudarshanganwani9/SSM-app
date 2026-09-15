const mongoose = require('mongoose');

const companySettingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: 'COMPANY_SETTINGS', unique: true },
    companyName: { type: String, default: 'SSM' },
    companyLogoUrl: { type: String, default: '' },
    companyEmail: { type: String, default: '' },
    companyPhone: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CompanySettings', companySettingsSchema);
