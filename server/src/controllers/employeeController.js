const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const EmployeeProfile = require('../models/EmployeeProfile');
const ApiError = require('../utils/ApiError');
const { recordAudit } = require('../services/auditService');
const { sendEmail } = require('../utils/sendEmail');

const PERSONAL_FIELDS = [
  'profilePhotoUrl',
  'dateOfBirth',
  'gender',
  'address',
  'city',
  'state',
  'pincode',
  'emergencyContactName',
  'emergencyContactRelationship',
  'emergencyContactNumber',
];

const PROFESSIONAL_FIELDS = [
  'department',
  'designation',
  'jobRole',
  'fieldOfWork',
  'dateOfJoining',
  'employmentType',
  'reportingManager',
];

function isProfileComplete(profile) {
  const required = ['dateOfBirth', 'gender', 'address', 'city', 'state', 'pincode'];
  return required.every((f) => profile[f] !== undefined && profile[f] !== null && profile[f] !== '');
}

// GET /api/employees  (Admin) - search, filter, paginate
const listEmployees = asyncHandler(async (req, res) => {
  const { search = '', department = '', status = '', page = 1, limit = 20 } = req.query;

  const userQuery = { role: 'EMPLOYEE' };
  if (status) userQuery.status = status;
  if (search) {
    userQuery.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { employeeId: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(userQuery)
    .sort({ createdAt: -1 })
    .lean();

  const userIds = users.map((u) => u._id);
  const profileFilter = { user: { $in: userIds } };
  if (department) profileFilter.department = department;

  const profiles = await EmployeeProfile.find(profileFilter).lean();
  const profileByUser = new Map(profiles.map((p) => [String(p.user), p]));

  let merged = users
    .filter((u) => !department || profileByUser.has(String(u._id)))
    .map((u) => ({
      ...u,
      passwordHash: undefined,
      profile: profileByUser.get(String(u._id)) || null,
    }));

  const total = merged.length;
  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.max(1, Number(limit));
  const start = (pageNum - 1) * limitNum;
  merged = merged.slice(start, start + limitNum);

  res.json({
    success: true,
    data: merged,
    pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
  });
});

// GET /api/employees/:id (Admin - full detail)
const getEmployeeById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Employee not found.');

  const profile = await EmployeeProfile.findOne({ user: user._id }).populate(
    'reportingManager',
    'fullName email employeeId'
  );

  res.json({ success: true, data: { user: user.toSafeJSON(), profile } });
});

// GET /api/employees/me/profile (Self)
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await EmployeeProfile.findOne({ user: req.user._id }).populate(
    'reportingManager',
    'fullName email employeeId'
  );
  res.json({ success: true, data: { user: req.user.toSafeJSON(), profile } });
});

// PUT /api/employees/me/profile (Self - edit allowed personal fields)
const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await EmployeeProfile.findOne({ user: req.user._id });
  if (!profile) throw new ApiError(404, 'Profile not found.');

  PERSONAL_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) profile[field] = req.body[field];
  });
  await profile.save();

  // Employees may also set their OWN professional fields the very first time
  // they complete their profile (e.g. selecting their department), since no
  // admin has entered anything yet. After completion, professional fields
  // become admin-controlled only, in line with "Employee can edit allowed
  // personal information. Admin can view complete employee information."
  if (!req.user.profileCompleted) {
    PROFESSIONAL_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) profile[field] = req.body[field];
    });
    await profile.save();
  }

  const user = await User.findById(req.user._id);
  if (isProfileComplete(profile) && !user.profileCompleted) {
    user.profileCompleted = true;
    await user.save();
  }

  res.json({ success: true, message: 'Profile updated.', data: { user: user.toSafeJSON(), profile } });
});

// POST /api/employees/me/photo (Self)
const uploadMyProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded.');
  const profile = await EmployeeProfile.findOneAndUpdate(
    { user: req.user._id },
    { profilePhotoUrl: `/uploads/profile-photos/${req.file.filename}` },
    { new: true }
  );
  res.json({ success: true, message: 'Profile photo updated.', data: profile });
});

// PUT /api/employees/:id (Admin - edit any field incl. professional + bank)
const updateEmployeeByAdmin = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Employee not found.');

  const profile = await EmployeeProfile.findOne({ user: user._id });
  if (!profile) throw new ApiError(404, 'Employee profile not found.');

  const oldValue = profile.toObject();

  const editableFields = [...PERSONAL_FIELDS, ...PROFESSIONAL_FIELDS, 'bankDetails'];
  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) profile[field] = req.body[field];
  });
  await profile.save();

  if (req.body.fullName || req.body.mobile) {
    if (req.body.fullName) user.fullName = req.body.fullName;
    if (req.body.mobile) user.mobile = req.body.mobile;
    await user.save();
  }

  if (isProfileComplete(profile) && !user.profileCompleted) {
    user.profileCompleted = true;
    await user.save();
  }

  await recordAudit({
    adminId: req.user._id,
    action: 'EMPLOYEE_PROFILE_EDITED',
    targetModel: 'EmployeeProfile',
    targetId: profile._id,
    oldValue,
    newValue: profile.toObject(),
  });

  res.json({ success: true, message: 'Employee updated.', data: { user: user.toSafeJSON(), profile } });
});

// PATCH /api/employees/:id/status (Admin - activate/deactivate)
const setEmployeeStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    throw new ApiError(400, 'Status must be ACTIVE or INACTIVE.');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Employee not found.');
  if (user.role === 'ADMIN') throw new ApiError(400, 'Cannot change status of an Admin account.');

  const oldValue = { status: user.status };
  user.status = status;
  await user.save();

  await recordAudit({
    adminId: req.user._id,
    action: status === 'ACTIVE' ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED',
    targetModel: 'User',
    targetId: user._id,
    oldValue,
    newValue: { status },
  });

  res.json({ success: true, message: `Employee ${status === 'ACTIVE' ? 'activated' : 'deactivated'}.`, data: user.toSafeJSON() });
});

// POST /api/employees/:id/reset-password (Admin)
const resetEmployeePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'Employee not found.');

  const tempPassword = crypto.randomBytes(6).toString('hex');
  user.passwordHash = await User.hashPassword(tempPassword);
  user.mustChangePassword = true;
  await user.save();

  await recordAudit({
    adminId: req.user._id,
    action: 'EMPLOYEE_PASSWORD_RESET',
    targetModel: 'User',
    targetId: user._id,
  });

  const emailResult = await sendEmail({
    to: user.email,
    subject: 'SSM - Your password has been reset',
    text: `Your administrator reset your password. Temporary password: ${tempPassword}. Please log in and change it immediately.`,
    html: `<p>Your administrator reset your password.</p><p>Temporary password: <b>${tempPassword}</b></p><p>Please log in and change it immediately.</p>`,
  });

  res.json({
    success: true,
    message: 'Password reset. Temporary password sent to employee email.',
    ...(emailResult.devMode ? { devTempPassword: tempPassword } : {}),
  });
});

module.exports = {
  listEmployees,
  getEmployeeById,
  getMyProfile,
  updateMyProfile,
  uploadMyProfilePhoto,
  updateEmployeeByAdmin,
  setEmployeeStatus,
  resetEmployeePassword,
};
