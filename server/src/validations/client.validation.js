const Joi = require('joi');

const createClientSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(255).required().messages({
      'string.min': 'Client name must be at least 2 characters',
      'string.max': 'Client name cannot exceed 255 characters',
    }),
    email: Joi.string().email().allow('', null).optional(),
    phone: Joi.string()
      .pattern(/^[+]?[\d\s\-().]{7,20}$/)
      .allow('', null)
      .optional()
      .messages({
        'string.pattern.base': 'Phone number format is invalid',
      }),
    status: Joi.string().valid('active', 'inactive').default('active'),
    student_id: Joi.string().max(100).allow('', null).optional(),
    domain: Joi.string().max(255).allow('', null).optional(),
  }),
};

const updateClientSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(255).optional(),
    email: Joi.string().email().allow('', null).optional(),
    phone: Joi.string()
      .pattern(/^[+]?[\d\s\-().]{7,20}$/)
      .allow('', null)
      .optional(),
    status: Joi.string().valid('active', 'inactive').optional(),
    student_id: Joi.string().max(100).allow('', null).optional(),
    domain: Joi.string().max(255).allow('', null).optional(),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
  }),
};

module.exports = { createClientSchema, updateClientSchema };
