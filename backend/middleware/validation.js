const { body, validationResult } = require('express-validator');

/**
 * Middleware that checks validation results and returns HTTP 400 with field-level errors.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  next();
};

const validateRegister = [
  body('name')
    .isString().withMessage('Name must be a string')
    .trim()
    .notEmpty().withMessage('Name is required'),
  body('email')
    .isString().withMessage('Email must be a string')
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .isString().withMessage('Password must be a string')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('age')
    .optional({ checkFalsy: true })
    .isFloat({ min: 10, max: 120 }).withMessage('Age must be between 10 and 120'),
  body('height')
    .optional({ checkFalsy: true })
    .isFloat({ min: 50, max: 250 }).withMessage('Height must be between 50 and 250 cm'),
  body('weight')
    .optional({ checkFalsy: true })
    .isFloat({ min: 20, max: 300 }).withMessage('Weight must be between 20 and 300 kg'),
  body('diagnosedWithPCOS')
    .optional()
    .isBoolean().withMessage('diagnosedWithPCOS must be a boolean'),
  body('familyHistory')
    .optional()
    .isBoolean().withMessage('familyHistory must be a boolean'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isString().withMessage('Email must be a string')
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .isString().withMessage('Password must be a string')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const validateProfileUpdate = [
  body('name')
    .optional()
    .isString().withMessage('Name must be a string')
    .trim()
    .notEmpty().withMessage('Name cannot be empty'),
  body('email')
    .optional()
    .isString().withMessage('Email must be a string')
    .trim()
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .optional()
    .isString().withMessage('Password must be a string')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('currentPassword')
    .optional()
    .isString().withMessage('currentPassword must be a string'),
  body('age')
    .optional({ checkFalsy: true })
    .isFloat({ min: 10, max: 120 }).withMessage('Age must be between 10 and 120'),
  body('height')
    .optional({ checkFalsy: true })
    .isFloat({ min: 50, max: 250 }).withMessage('Height must be between 50 and 250 cm'),
  body('weight')
    .optional({ checkFalsy: true })
    .isFloat({ min: 20, max: 300 }).withMessage('Weight must be between 20 and 300 kg'),
  body('diagnosedWithPCOS')
    .optional()
    .isBoolean().withMessage('diagnosedWithPCOS must be a boolean'),
  body('familyHistory')
    .optional()
    .isBoolean().withMessage('familyHistory must be a boolean'),
  handleValidationErrors
];

const validateDeleteMe = [
  body('currentPassword')
    .isString().withMessage('currentPassword must be a string')
    .notEmpty().withMessage('currentPassword is required to delete account'),
  handleValidationErrors
];

const validateCycle = [
  body('startDate')
    .notEmpty().withMessage('startDate is required')
    .isISO8601().withMessage('startDate must be a valid ISO8601 date'),
  body('endDate')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('endDate must be a valid ISO8601 date')
    .custom((endDate, { req }) => {
      if (endDate && req.body.startDate) {
        if (new Date(endDate) < new Date(req.body.startDate)) {
          throw new Error('endDate must be greater than or equal to startDate');
        }
      }
      return true;
    }),
  body('symptoms')
    .optional()
    .isArray().withMessage('symptoms must be an array')
    .custom((symptoms) => {
      if (Array.isArray(symptoms)) {
        if (!symptoms.every(s => typeof s === 'string')) {
          throw new Error('Each symptom must be a string');
        }
      }
      return true;
    }),
  body('mood')
    .optional({ checkFalsy: true })
    .isIn(['excellent', 'good', 'neutral', 'poor', 'very-poor']).withMessage('mood must be one of: excellent, good, neutral, poor, very-poor'),
  body('notes')
    .optional()
    .isString().withMessage('notes must be a string'),
  handleValidationErrors
];

const validateSymptoms = [
  body('name')
    .isString().withMessage('Symptom name must be a string')
    .trim()
    .notEmpty().withMessage('Symptom name is required'),
  body('severity')
    .notEmpty().withMessage('severity is required')
    .isInt({ min: 1, max: 10 }).withMessage('severity must be an integer between 1 and 10'),
  handleValidationErrors
];

const validateLifestyle = [
  body('exercise')
    .optional()
    .isBoolean().withMessage('exercise must be a boolean'),
  body('diet')
    .optional({ checkFalsy: true })
    .isIn(['balanced', 'vegetarian', 'vegan', 'keto', 'other']).withMessage('diet must be one of: balanced, vegetarian, vegan, keto, other'),
  body('stress')
    .optional({ checkFalsy: true })
    .isInt({ min: 1, max: 10 }).withMessage('stress must be between 1 and 10'),
  body('sleep')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0, max: 24 }).withMessage('sleep must be between 0 and 24 hours'),
  handleValidationErrors
];

const validateRiskAssessment = [
  body('symptoms')
    .isArray().withMessage('symptoms must be an array')
    .custom((symptoms) => {
      if (!Array.isArray(symptoms) || !symptoms.every(s => typeof s === 'string')) {
        throw new Error('symptoms must be an array of strings');
      }
      return true;
    }),
  body('age')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('age must be a positive number'),
  body('bmi')
    .optional({ checkFalsy: true })
    .isFloat({ min: 0 }).withMessage('bmi must be a positive number'),
  body('familyHistory')
    .optional()
    .isBoolean().withMessage('familyHistory must be a boolean'),
  body('diagnosedWithPCOS')
    .optional()
    .isBoolean().withMessage('diagnosedWithPCOS must be a boolean'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateDeleteMe,
  validateCycle,
  validateSymptoms,
  validateLifestyle,
  validateRiskAssessment
};
