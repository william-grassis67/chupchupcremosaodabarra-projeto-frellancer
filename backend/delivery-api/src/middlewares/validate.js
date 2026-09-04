const { validationResult } = require('express-validator');
const { error } = require('../utils/apiResponse');

// Runs after an array of express-validator checks.
// If any failed, respond with a standardized 422 error listing them all.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().reduce((result, validationError) => {
      result[validationError.path] = validationError.msg;
      return result;
    }, {});
    return error(res, 'Validation failed', 422, formatted);
  }
  next();
}

module.exports = validate;
