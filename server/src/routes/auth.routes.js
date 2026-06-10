const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { registerSchema, loginSchema } = require('../validations/auth.validation');

// Public
router.post('/login', validate(loginSchema), authController.login);

// Admin-only registration
router.post(
  '/register',
  authenticate,
  authorize('admin'),
  validate(registerSchema),
  authController.register
);

module.exports = router;
