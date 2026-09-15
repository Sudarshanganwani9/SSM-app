require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const EmployeeProfile = require('../models/EmployeeProfile');
const LeaveType = require('../models/LeaveType');
const Holiday = require('../models/Holiday');
const CompanySettings = require('../models/CompanySettings');
const OfficeSettings = require('../models/OfficeSettings');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[seed:demo] MONGODB_URI is not set in your .env file.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('[seed:demo] Connected to database.');

  // Company + office settings (idempotent upsert)
  await CompanySettings.findOneAndUpdate(
    { singletonKey: 'COMPANY_SETTINGS' },
    {
      singletonKey: 'COMPANY_SETTINGS',
      companyName: 'SSM',
      companyEmail: 'hr@ssm.example.com',
      companyPhone: '+91 90000 00000',
      address: 'SSM Corporate Office, India',
    },
    { upsert: true }
  );
  await OfficeSettings.findOneAndUpdate(
    { singletonKey: 'OFFICE_SETTINGS' },
    { singletonKey: 'OFFICE_SETTINGS' },
    { upsert: true }
  );
  console.log('[seed:demo] Company & office settings ensured.');

  // Leave types
  const leaveTypeDefs = [
    { name: 'Casual Leave', code: 'CL', defaultAnnualDays: 12 },
    { name: 'Sick Leave', code: 'SL', defaultAnnualDays: 10 },
    { name: 'Earned Leave', code: 'EL', defaultAnnualDays: 15 },
    { name: 'Emergency Leave', code: 'EML', defaultAnnualDays: 3 },
    { name: 'Unpaid Leave', code: 'UL', defaultAnnualDays: 0, isPaid: false },
  ];
  for (const def of leaveTypeDefs) {
    // eslint-disable-next-line no-await-in-loop
    await LeaveType.findOneAndUpdate({ code: def.code }, def, { upsert: true });
  }
  console.log('[seed:demo] Leave types ensured.');

  // Holidays (current year, India-relevant examples)
  const year = new Date().getFullYear();
  const holidayDefs = [
    { name: 'Republic Day', date: new Date(`${year}-01-26`), type: 'NATIONAL' },
    { name: 'Independence Day', date: new Date(`${year}-08-15`), type: 'NATIONAL' },
    { name: 'Gandhi Jayanti', date: new Date(`${year}-10-02`), type: 'NATIONAL' },
    { name: 'Diwali', date: new Date(`${year}-11-01`), type: 'COMPANY' },
    { name: 'Christmas', date: new Date(`${year}-12-25`), type: 'COMPANY' },
  ];
  for (const def of holidayDefs) {
    // eslint-disable-next-line no-await-in-loop
    await Holiday.findOneAndUpdate({ name: def.name, date: def.date }, def, { upsert: true });
  }
  console.log('[seed:demo] Sample holidays ensured.');

  // A demo employee (only created if absent)
  const demoEmail = 'demo.employee@ssm.example.com';
  let demoUser = await User.findOne({ email: demoEmail });
  if (!demoUser) {
    const passwordHash = await User.hashPassword('Demo@1234');
    demoUser = await User.create({
      fullName: 'Demo Employee',
      email: demoEmail,
      mobile: '9876543210',
      passwordHash,
      role: 'EMPLOYEE',
      employeeId: 'SSM-EMP-DEMO',
      profileCompleted: true,
    });
    await EmployeeProfile.create({
      user: demoUser._id,
      dateOfBirth: new Date('1995-06-15'),
      gender: 'Male',
      address: '123 Demo Street',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452001',
      department: 'Engineering',
      designation: 'Software Engineer',
      jobRole: 'Backend Developer',
      dateOfJoining: new Date(),
      employmentType: 'Full-Time',
      emergencyContactName: 'Demo Contact',
      emergencyContactRelationship: 'Sibling',
      emergencyContactNumber: '9876500000',
    });
    console.log(`[seed:demo] Demo employee created: ${demoEmail} / Demo@1234`);
  } else {
    console.log('[seed:demo] Demo employee already exists. Skipped.');
  }

  console.log('[seed:demo] Done.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[seed:demo] Failed:', err);
  process.exit(1);
});
