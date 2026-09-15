const { body } = require('express-validator');

const applyLeaveValidator = [
  body('leaveType').notEmpty().withMessage('Leave type is required.'),
  body('startDate').isISO8601().withMessage('A valid start date is required.'),
  body('endDate').isISO8601().withMessage('A valid end date is required.'),
  body('isHalfDay').optional().isBoolean(),
  body('halfDaySession')
    .if(body('isHalfDay').equals('true'))
    .isIn(['FIRST_HALF', 'SECOND_HALF'])
    .withMessage('Half-day session must be FIRST_HALF or SECOND_HALF.'),
  body('reason').trim().notEmpty().withMessage('A reason is required.'),
];

const decideLeaveValidator = [
  body('adminRemarks').optional().trim(),
];

module.exports = { applyLeaveValidator, decideLeaveValidator };
