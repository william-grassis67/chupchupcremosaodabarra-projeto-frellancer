const AppError = require('../utils/AppError');

// Catches any request that didn't match a route.
function notFound(req, res, next) {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404));
}

module.exports = notFound;
