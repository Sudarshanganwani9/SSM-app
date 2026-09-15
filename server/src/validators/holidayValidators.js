const { body } = require('express-validator');

const holidayValidator = [
  body('name').trim().notEmpty().withMessage('Holiday name is required.'),
  body('date').isISO8601().withMessage('A valid date is required.'),
  body('type')
    .optional()
    .isIn(['NATIONAL', 'REGIONAL', 'COMPANY', 'OPTIONAL'])
    .withMessage('Invalid holiday type.'),
];

module.exports = { holidayValidator };
