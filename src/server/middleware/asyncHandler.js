'use strict';

/**
 * Wraps an async Express route handler and forwards errors to centralized middleware.
 * @param {import('express').RequestHandler} fn - Async route handler function.
 * @returns {import('express').RequestHandler} Wrapped handler with automatic error propagation.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
