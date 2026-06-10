const { ForbiddenError } = require('../utils/errors');

/**
 * Role-based authorization middleware factory
 * Usage: authorize('admin', 'recruiter')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('No user context found'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Role '${req.user.role}' is not authorized for this action`
        )
      );
    }

    next();
  };
};

module.exports = authorize;
