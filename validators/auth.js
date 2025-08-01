import {body} from 'express-validator';

export const validateRegister = [
  body('firstname').notEmpty().withMessage('Name is required'),
  body('lastname').notEmpty().withMessage('Name is required'),
  body('email').optional().isEmail().withMessage('Invalid email'),
  body('mobile')
    .optional()
    .isMobilePhone()
    .withMessage('Invalid mobile number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body().custom((value) => {
    if (!value.email && !value.mobile) {
      throw new Error('Either email or mobile is required');
    }
    return true;
  }),
];

export const validateverify = [
      body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email'),

  body('otp')
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),
]