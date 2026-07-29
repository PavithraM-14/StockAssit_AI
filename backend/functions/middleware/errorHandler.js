/**
 * Global Error Handler Middleware & Custom Error Classes
 * 
 * Provides centralized error handling for all Express routes.
 * Distinguishes between operational errors (safe to expose to client)
 * and unexpected errors (log details, return generic message).
 */

/**
 * Custom Application Error Class
 * 
 * Use this to throw operational errors with specific status codes.
 * These errors are safe to send to the client with their original message.
 * 
 * Usage:
 *   throw new AppError('User not found', 404);
 *   throw new AppError('Invalid input', 400);
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Flag to identify known errors
    this.name = this.constructor.name;
    
    // Capture stack trace (excluding constructor call)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Error Handler Middleware
 * 
 * This should be the LAST middleware in your Express app:
 *   app.use(errorHandler);
 * 
 * Handles:
 * - Custom AppError instances (operational errors)
 * - Mongoose validation errors
 * - MongoDB duplicate key errors
 * - JWT errors
 * - Unexpected errors (logs full details, returns generic 500)
 * 
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next (required for error handler signature)
 */
const errorHandler = (err, req, res, next) => {
  // Log the error for server-side debugging
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ Error caught by global handler:');
  console.error('Path:', req.method, req.originalUrl);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.code || 'INTERNAL_ERROR';

  // Handle known operational errors (AppError)
  if (err.isOperational) {
    return res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: message,
      statusCode: statusCode,
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    const errors = Object.values(err.errors).map(e => e.message);
    message = errors.join(', ');
    
    return res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: message,
      statusCode: statusCode,
      validationErrors: errors,
    });
  }

  // Handle Mongoose duplicate key errors (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyPattern || {})[0];
    message = field 
      ? `A record with this ${field} already exists`
      : 'Duplicate key error';
    
    return res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: message,
      statusCode: statusCode,
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
    
    return res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: message,
      statusCode: statusCode,
    });
  }

  // Handle JWT errors (should be rare if using middleware correctly)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
    
    return res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: message,
      statusCode: statusCode,
    });
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
    
    return res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: message,
      statusCode: statusCode,
    });
  }

  // Handle unexpected errors (programming errors, not operational)
  // Don't leak internal details to the client
  console.error('⚠️  UNEXPECTED ERROR - This should be investigated:', err);

  return res.status(500).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
    statusCode: 500,
    // Only include error details in development environment
    ...(process.env.NODE_ENV === 'development' && {
      details: err.message,
      stack: err.stack,
    }),
  });
};

/**
 * Helper function to wrap async route handlers
 * Catches errors and passes them to the error handler
 * 
 * Usage:
 *   router.get('/route', catchAsync(async (req, res) => {
 *     const data = await someAsyncOperation();
 *     res.json({ success: true, data });
 *   }));
 * 
 * This eliminates the need for try/catch in every async route
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found Handler
 * Use this before the global error handler to catch undefined routes
 * 
 * Usage:
 *   app.use(notFoundHandler);
 *   app.use(errorHandler);
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.originalUrl}`,
    404
  );
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};

module.exports = errorHandler;
module.exports.AppError = AppError;
module.exports.catchAsync = catchAsync;
module.exports.notFoundHandler = notFoundHandler;
