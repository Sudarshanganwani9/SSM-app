const CompanySettings = require('../models/CompanySettings');
const OfficeSettings = require('../models/OfficeSettings');

async function getCompanySettings() {
  let doc = await CompanySettings.findOne({ singletonKey: 'COMPANY_SETTINGS' });
  if (!doc) doc = await CompanySettings.create({});
  return doc;
}

async function getOfficeSettings() {
  let doc = await OfficeSettings.findOne({ singletonKey: 'OFFICE_SETTINGS' });
  if (!doc) doc = await OfficeSettings.create({});
  return doc;
}

module.exports = { getCompanySettings, getOfficeSettings };
