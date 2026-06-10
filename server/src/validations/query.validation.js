const Joi = require('joi');

const createQuerySchema = {
  body: Joi.object({
    client_id: Joi.string().uuid().required().messages({
      'string.guid': 'client_id must be a valid UUID',
    }),
    issue_description: Joi.string().min(10).required().messages({
      'string.min': 'Issue description must be at least 10 characters',
    }),
    category: Joi.string()
      .valid('technical', 'billing', 'account', 'other')
      .required(),
    notes: Joi.string().allow('', null).optional(),
  }),
};

const updateQuerySchema = {
  body: Joi.object({
    issue_description: Joi.string().min(10).optional(),
    category: Joi.string()
      .valid('technical', 'billing', 'account', 'other')
      .optional(),
    status: Joi.string()
      .valid('open', 'in_progress', 'resolved', 'closed')
      .optional(),
    notes: Joi.string().allow('', null).optional(),
  }).min(1),
};

module.exports = { createQuerySchema, updateQuerySchema };
