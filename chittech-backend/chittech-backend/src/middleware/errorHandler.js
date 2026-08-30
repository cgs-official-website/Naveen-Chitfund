/**
 * Wrap async route handlers so thrown errors reach the error middleware
 * instead of crashing the process / hanging the request.
 */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** Small helper for handlers to throw a typed HTTP error. */
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  if (status >= 500) {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
  }

  res.status(status).json({
    success: false,
    error: status >= 500 ? 'Internal server error' : err.message,
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ success: false, error: `No route: ${req.method} ${req.originalUrl}` });
}

module.exports = { asyncHandler, ApiError, errorHandler, notFoundHandler };
