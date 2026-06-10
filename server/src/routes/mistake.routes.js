const router = require('express').Router();
const mistakeController = require('../controllers/mistake.controller');
const validate = require('../middleware/validate');
const authorize = require('../middleware/authorize');
const { createMistakeSchema, updateMistakeSchema } = require('../validations/mistake.validation');

router.get('/', mistakeController.list);
router.post(
  '/',
  authorize('admin', 'recruiter'),
  validate(createMistakeSchema),
  mistakeController.create
);
router.put(
  '/:id',
  authorize('admin', 'recruiter'),
  validate(updateMistakeSchema),
  mistakeController.update
);
router.delete('/:id', authorize('admin'), mistakeController.remove);

module.exports = router;
