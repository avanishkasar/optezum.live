/**
 * @file Unit tests for security middleware
 * @module tests/unit/security
 */

const { createRateLimiters, attachCspNonce, createSecurityMiddleware } = require('../../src/server/middleware/security');
const { RATE_LIMIT } = require('../../src/shared/constants');

describe('Security Middleware', () => {
  test('should create stricter analyze and chat limiters', () => {
    const { generalLimiter, analyzeLimiter, chatLimiter } = createRateLimiters();
    expect(generalLimiter).toBeDefined();
    expect(analyzeLimiter).toBeDefined();
    expect(chatLimiter).toBeDefined();
    expect(RATE_LIMIT.ANALYZE_MAX).toBeLessThan(RATE_LIMIT.GENERAL_MAX);
  });

  test('should attach CSP nonce to response locals', () => {
    const res = { locals: {} };
    attachCspNonce({}, res, () => {
      expect(res.locals.cspNonce).toBeDefined();
      expect(typeof res.locals.cspNonce).toBe('string');
    });
  });

  test('should reject disallowed CORS origins', (done) => {
    const { corsMiddleware } = createSecurityMiddleware();
    corsMiddleware(
      { headers: { origin: 'https://evil.example.com' } },
      {},
      (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toMatch(/CORS/);
        done();
      },
    );
  });

  test('should allow localhost CORS origins', (done) => {
    const { corsMiddleware } = createSecurityMiddleware();
    const res = { setHeader: jest.fn(), getHeader: jest.fn() };
    corsMiddleware(
      { headers: { origin: 'http://localhost:3000' } },
      res,
      (err) => {
        expect(err).toBeUndefined();
        done();
      },
    );
  });
});
