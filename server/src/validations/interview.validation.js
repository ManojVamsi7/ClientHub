const Joi = require('joi');

const createInterviewSchema = {
  body: Joi.object({
    client_id: Joi.string().uuid().required(),
    call_date: Joi.date().iso().max('now').required().messages({
      'date.max': 'Call date must be in the past or current',
    }),
    recruiter_name: Joi.string().min(2).max(255).required(),
    position_applied: Joi.string().max(255).allow('', null).optional(),
    call_notes: Joi.string().allow('', null).optional(),
  }),
};

module.exports = { createInterviewSchema };
