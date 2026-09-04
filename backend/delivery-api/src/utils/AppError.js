// Custom operational error class.
// Lets controllers/services throw errors with a specific HTTP status
// that the global error handler knows how to translate into a JSON response.
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
