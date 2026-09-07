/**
 * Centralized error-handling middleware.
 *
 * Catches all errors thrown or passed via next(err) in routes/controllers
 * and returns a consistent JSON error response.
 */
function errorHandler(err, _req, res, _next) {
  // Prisma known request errors (e.g. unique constraint, invalid data)
  if (err.code && err.code.startsWith('P')) {
    console.error('[TruthLayer Backend] Prisma error:', err.code, err.message)
    return res.status(400).json({
      error: 'Database error',
      message: `A database constraint was violated (${err.code}).`,
    })
  }

  // Client errors forwarded with a status
  const status = err.status || err.statusCode || 500
  if (status < 500) {
    return res.status(status).json({
      error: err.type || 'Bad request',
      message: err.message,
    })
  }

  // Unexpected server errors
  console.error('[TruthLayer Backend] Unhandled error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred. Please try again later.',
  })
}

module.exports = errorHandler
