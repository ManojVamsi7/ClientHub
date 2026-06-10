const router = require('express').Router();
const clientController = require('../controllers/client.controller');
const validate = require('../middleware/validate');
const authorize = require('../middleware/authorize');
const { createClientSchema, updateClientSchema } = require('../validations/client.validation');

router.get('/', clientController.list);
router.get('/domains', clientController.getDomains);
router.get('/:id', clientController.getById);
router.post(
  '/',
  authorize('admin', 'recruiter'),
  validate(createClientSchema),
  clientController.create
);
router.put(
  '/:id',
  authorize('admin', 'recruiter'),
  validate(updateClientSchema),
  clientController.update
);
router.post(
  '/import',
  authorize('admin', 'recruiter'),
  clientController.bulkImport
);
router.post(
  '/bulk-delete',
  authorize('admin'),
  clientController.bulkRemove
);
router.delete('/:id', authorize('admin'), clientController.remove);

module.exports = router;
