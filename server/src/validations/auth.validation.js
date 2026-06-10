const Joi = require('joi');

const registerSchema = {
  body: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required().messages({
      'string.alphanum': 'Username must only contain letters and numbers',
      'string.min': 'Username must be at least 3 characters',
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Must be a valid email address',
    }),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters',
        'string.pattern.base':
          'Password must contain at least one uppercase letter and one number',
      }),
    role: Joi.string().valid('admin', 'recruiter', 'viewer').default('viewer'),
  }),
};

const loginSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

module.exports = { registerSchema, loginSchema };
