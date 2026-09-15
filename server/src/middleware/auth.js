const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Verifies the JWT (from the httpOnly cookie or Authorization header),
 * loads the user, and rejects inactive accounts.
 * This is the SINGLE source of truth for auth - frontend route guards are
 * a UX convenience only, never a security boundary.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token = null;

  if (req.cookies && req.cookies.ssm_token) {
    token = req.cookies.ssm_token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authenticated. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Session expired or invalid. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'Account no longer exists.');
  }
  if (user.status === 'INACTIVE') {
    throw new ApiError(403, 'This account has been deactivated. Contact your administrator.');
  }

  req.user = user;
  next();
});

/**
 * Restricts access to the given roles. Use AFTER `protect`.
 * Every Admin-only route MUST use authorize('ADMIN') - this is enforced
 * server-side regardless of what the frontend shows or hides.
 */
const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authenticated.');
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'You do not have permission to perform this action.');
    }
    next();
  };

module.exports = { protect, authorize };
