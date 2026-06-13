'use strict';

const { GEMINI, HTTP_STATUS, SERVER } = require('../../shared/constants');

/**
 * Logs server errors without exposing internals to clients.
 * @param {string} context - Route or module context label.
 * @param {Error} err - Error instance.
 * @returns {void}
 */
function logServerError(context, err) {
  // eslint-disable-next-line no-console -- intentional server-side error logging
  console.error(`[${context}]`, err.message);
}

/**
 * Maps known errors to HTTP status codes and safe client messages.
 * @param {Error} err - Error thrown by route or service layer.
 * @returns {{ status: number, body: object }} Safe HTTP response payload.
 */
function mapErrorToResponse(err) {
  const message = err && err.message ? err.message : 'Unknown error';

  if (message.includes(GEMINI.API_KEY_ERROR_FRAGMENT)) {
    return {
      status: HTTP_STATUS.SERVICE_UNAVAILABLE,
      body: {
        success: false,
        error: 'Gemini API not configured. Set GEMINI_API_KEY in .env.',
      },
    };
  }

  if (err.statusCode && err.publicMessage) {
    return {
      status: err.statusCode,
      body: { success: false, error: err.publicMessage },
    };
  }

  return {
    status: HTTP_STATUS.INTERNAL_ERROR,
    body: { success: false, error: 'Internal server error.' },
  };
}

/**
 * Centralized Express error-handling middleware for API and server errors.
 * @param {Error} err - Error passed via next(err).
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {void}
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const context = req.originalUrl || SERVER.SERVICE_NAME;
  logServerError(context, err);

  if (req.path && req.path.startsWith('/api')) {
    const mapped = mapErrorToResponse(err);
    return res.status(mapped.status).json(mapped.body);
  }

  return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
    success: false,
    error: 'Internal server error.',
  });
}

/**
 * Creates a route-specific API error with a public-safe message.
 * @param {number} statusCode - HTTP status code.
 * @param {string} publicMessage - Client-safe error message.
 * @returns {Error} Error object with statusCode and publicMessage properties.
 */
function createApiError(statusCode, publicMessage) {
  const error = new Error(publicMessage);
  error.statusCode = statusCode;
  error.publicMessage = publicMessage;
  return error;
}

module.exports = { errorHandler, mapErrorToResponse, createApiError, logServerError };
