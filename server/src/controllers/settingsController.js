const asyncHandler = require('express-async-handler');
const { getCompanySettings, getOfficeSettings } = require('../services/settingsService');
const CompanySettings = require('../models/CompanySettings');
const OfficeSettings = require('../models/OfficeSettings');
const { recordAudit } = require('../services/auditService');

// GET /api/settings (any authenticated user - employees need office/company info too)
const getSettings = asyncHandler(async (req, res) => {
  const [company, office] = await Promise.all([getCompanySettings(), getOfficeSettings()]);
  res.json({ success: true, data: { company, office } });
});

// PUT /api/settings (Admin only) - accepts partial { company: {...}, office: {...} }
const updateSettings = asyncHandler(async (req, res) => {
  const { company, office } = req.body;
  const result = {};

  if (company) {
    const before = await getCompanySettings();
    const oldValue = before.toObject();
    Object.assign(before, company);
    await before.save();
    result.company = before;
    await recordAudit({
      adminId: req.user._id,
      action: 'COMPANY_SETTINGS_UPDATED',
      targetModel: 'CompanySettings',
      targetId: before._id,
      oldValue,
      newValue: before.toObject(),
    });
  }

  if (office) {
    const before = await getOfficeSettings();
    const oldValue = before.toObject();
    // Deep-merge nested rule objects rather than overwriting wholesale
    if (office.leaveRules) office.leaveRules = { ...before.leaveRules.toObject?.() ?? before.leaveRules, ...office.leaveRules };
    if (office.cofRules) office.cofRules = { ...before.cofRules.toObject?.() ?? before.cofRules, ...office.cofRules };
    if (office.notificationSettings) {
      office.notificationSettings = {
        ...(before.notificationSettings.toObject?.() ?? before.notificationSettings),
        ...office.notificationSettings,
      };
    }
    Object.assign(before, office);
    await before.save();
    result.office = before;
    await recordAudit({
      adminId: req.user._id,
      action: 'OFFICE_SETTINGS_UPDATED',
      targetModel: 'OfficeSettings',
      targetId: before._id,
      oldValue,
      newValue: before.toObject(),
    });
  }

  res.json({ success: true, message: 'Settings updated.', data: result });
});

// POST /api/settings/logo (Admin only)
const uploadLogo = asyncHandler(async (req, res) => {
  const company = await getCompanySettings();
  company.companyLogoUrl = `/uploads/company-logo/${req.file.filename}`;
  await company.save();
  res.json({ success: true, message: 'Company logo updated.', data: company });
});

module.exports = { getSettings, updateSettings, uploadLogo };
