const Joi = require('joi');

const createMistakeSchema = {
  body: Joi.object({
    recruiter_name: Joi.string().min(2).max(255).required(),
    mistake_description: Joi.string().min(10).required().messages({
      'string.min': 'Mistake description must be at least 10 characters',
    }),
    severity: Joi.string().valid('low', 'medium', 'high').required(),
    impact: Joi.string().allow('', null).optional(),
    resolution_notes: Joi.string().allow('', null).optional(),
  }),
};

const updateMistakeSchema = {
  body: Joi.object({
    recruiter_name: Joi.string().min(2).max(255).optional(),
    mistake_description: Joi.string().min(10).optional(),
    severity: Joi.string().valid('low', 'medium', 'high').optional(),
    impact: Joi.string().allow('', null).optional(),
    resolution_notes: Joi.string().allow('', null).optional(),
  }).min(1),
};

module.exports = { createMistakeSchema, updateMistakeSchema };
