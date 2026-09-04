const { error } = require('../utils/apiResponse');

// Translates Prisma known errors into friendlier messages.
function handlePrismaError(err) {
  switch (err.code) {
    case 'P2002':
      return { statusCode: 409, message: `Duplicate value for field: ${err.meta?.target}` };
    case 'P2003':
      return { statusCode: 409, message: 'Operation violates a foreign key constraint' };
    case 'P2025':
      return { statusCode: 404, message: 'Record not found' };
    default:
      return { statusCode: 400, message: 'Database error' };
  }
}

// Must be registered LAST, after all routes.
// eslint-disable-next-line no-unused-vars
function globalErrorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Prisma errors carry a `code` like "P2002"
  if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    const handled = handlePrismaError(err);
    statusCode = handled.statusCode;
    message = handled.message;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  } else if (!err.isOperational) {
    // Don't leak internal details in production for unexpected errors
    console.error('UNEXPECTED ERROR:', err);
    message = statusCode === 500 ? 'Internal server error' : message;
  }

  return error(res, message, statusCode);
}

module.exports = globalErrorHandler;
