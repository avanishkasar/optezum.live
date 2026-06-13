/**
 * @file Unit tests for centralized error handler
 * @module tests/unit/errorHandler
 */

const { errorHandler, mapErrorToResponse, createApiError } = require('../../src/server/middleware/errorHandler');
const { HTTP_STATUS } = require('../../src/shared/constants');

describe('Error Handler', () => {
  test('should map missing Gemini API key to 503', () => {
    const err = new Error('Gemini API key is not configured');
    const mapped = mapErrorToResponse(err);
    expect(mapped.status).toBe(HTTP_STATUS.SERVICE_UNAVAILABLE);
    expect(mapped.body.error).toMatch(/GEMINI_API_KEY/);
  });

  test('should map unknown errors to 500', () => {
    const mapped = mapErrorToResponse(new Error('Unexpected failure'));
    expect(mapped.status).toBe(HTTP_STATUS.INTERNAL_ERROR);
  });

  test('should map custom API errors with public message', () => {
    const err = createApiError(HTTP_STATUS.BAD_REQUEST, 'Origin not allowed.');
    const mapped = mapErrorToResponse(err);
    expect(mapped.status).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(mapped.body.error).toBe('Origin not allowed.');
  });

  test('should handle API errors via middleware', () => {
    const err = new Error('Gemini API key missing');
    const req = { path: '/api/chat', originalUrl: '/api/chat' };
    const res = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.SERVICE_UNAVAILABLE);
  });

  test('should delegate when headers already sent', () => {
    const err = new Error('late failure');
    const res = { headersSent: true };
    const next = jest.fn();
    errorHandler(err, { path: '/api/chat' }, res, next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
