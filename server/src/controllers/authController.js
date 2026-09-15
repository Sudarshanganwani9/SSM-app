const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const EmployeeProfile = require('../models/EmployeeProfile');
const PasswordResetToken = require('../models/PasswordResetToken');
const ApiError = require('../utils/ApiError');
const { generateToken, setTokenCookie } = require('../utils/generateToken');
const { sendEmail } = require('../utils/sendEmail');
const { notifyAllAdmins } = require('../services/notificationService');

async function nextEmployeeId() {
  const count = await User.countDocuments({ role: 'EMPLOYEE' });
  return `SSM-EMP-${String(count + 1).padStart(4, '0')}`;
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { fullName, email, mobile, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const passwordHash = await User.hashPassword(password);
  const employeeId = await nextEmployeeId();

  const user = await User.create({
    fullName,
    email,
    mobile,
    passwordHash,
    role: 'EMPLOYEE',
    employeeId,
    profileCompleted: false,
  });

  await EmployeeProfile.create({ user: user._id });

  await notifyAllAdmins({
    type: 'NEW_EMPLOYEE_REGISTRATION',
    title: 'New employee registration',
    message: `${fullName} (${email}) just registered and is awaiting profile completion.`,
    link: `/admin/employees/${user._id}`,
    relatedId: user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. You can now log in.',
    data: { id: user._id, email: user.email, employeeId },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (user.status === 'INACTIVE') {
    throw new ApiError(403, 'This account has been deactivated. Contact your administrator.');
  }

  const match = await user.comparePassword(password);
  if (!match) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user);
  setTokenCookie(res, token);

  res.json({
    success: true,
    message: 'Login successful.',
    data: { token, user: user.toSafeJSON() },
  });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie('ssm_token');
  res.json({ success: true, message: 'Logged out.' });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user.toSafeJSON() });
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond the same way, whether or not the account exists,
  // so we never leak which emails are registered.
  const genericResponse = {
    success: true,
    message: 'If an account exists for this email, a reset link has been sent.',
  };

  if (!user) {
    return res.json(genericResponse);
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await PasswordResetToken.create({ user: user._id, tokenHash, expiresAt });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`;

  const emailResult = await sendEmail({
    to: user.email,
    subject: 'SSM - Reset your password',
    text: `Reset your SSM password using this link (valid 30 minutes): ${resetUrl}`,
    html: `<p>Reset your SSM password using the link below (valid 30 minutes):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  // Development-safe mechanism: if SMTP isn't configured, we cannot email the
  // link, so we return it directly in the response (dev/non-production only)
  // so the flow remains fully testable without email infrastructure.
  if (emailResult.devMode && process.env.NODE_ENV !== 'production') {
    return res.json({ ...genericResponse, devResetUrl: resetUrl });
  }

  res.json(genericResponse);
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const resetRecord = await PasswordResetToken.findOne({
    tokenHash,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!resetRecord) {
    throw new ApiError(400, 'This reset link is invalid or has expired.');
  }

  const user = await User.findById(resetRecord.user);
  if (!user) {
    throw new ApiError(400, 'This reset link is invalid or has expired.');
  }

  user.passwordHash = await User.hashPassword(password);
  user.mustChangePassword = false;
  await user.save();

  resetRecord.used = true;
  await resetRecord.save();

  res.json({ success: true, message: 'Password reset successful. You can now log in.' });
});

// POST /api/auth/change-password (authenticated)
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');

  const match = await user.comparePassword(currentPassword);
  if (!match) {
    throw new ApiError(401, 'Current password is incorrect.');
  }

  user.passwordHash = await User.hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully.' });
});

module.exports = {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
};
