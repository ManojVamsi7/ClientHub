const router = require('express').Router();
const queryController = require('../controllers/query.controller');
const validate = require('../middleware/validate');
const authorize = require('../middleware/authorize');
const { createQuerySchema, updateQuerySchema } = require('../validations/query.validation');

router.get('/', queryController.list);
router.post(
  '/',
  authorize('admin', 'recruiter'),
  validate(createQuerySchema),
  queryController.create
);
router.put(
  '/:id',
  authorize('admin', 'recruiter'),
  validate(updateQuerySchema),
  queryController.update
);
router.delete('/:id', authorize('admin'), queryController.remove);

module.exports = router;
