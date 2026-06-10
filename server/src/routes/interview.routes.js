const router = require('express').Router();
const interviewController = require('../controllers/interview.controller');
const validate = require('../middleware/validate');
const authorize = require('../middleware/authorize');
const { createInterviewSchema } = require('../validations/interview.validation');

router.get('/', interviewController.list);
router.post(
  '/',
  authorize('admin', 'recruiter'),
  validate(createInterviewSchema),
  interviewController.create
);
router.delete('/:id', authorize('admin'), interviewController.remove);

module.exports = router;
