'use strict';

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const crypto = require('crypto');
const { RATE_LIMIT, HSTS, ALLOWED_ORIGINS } = require('../../shared/constants');

/**
 * Creates rate limiters for general and AI-heavy API routes.
 * @returns {{ generalLimiter: Function, analyzeLimiter: Function, chatLimiter: Function }}
 */
function createRateLimiters() {
  const generalLimiter = rateLimit({
    windowMs: RATE_LIMIT.GENERAL_WINDOW_MS,
    max: RATE_LIMIT.GENERAL_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again after 15 minutes.' },
  });

  const analyzeLimiter = rateLimit({
    windowMs: RATE_LIMIT.ANALYZE_WINDOW_MS,
    max: RATE_LIMIT.ANALYZE_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many journal analysis requests. Please wait before trying again.' },
  });

  const chatLimiter = rateLimit({
    windowMs: RATE_LIMIT.CHAT_WINDOW_MS,
    max: RATE_LIMIT.CHAT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many chat requests. Please wait before trying again.' },
  });

  return { generalLimiter, analyzeLimiter, chatLimiter };
}

/**
 * Generates a per-request CSP nonce for inline resources when needed.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {void}
 */
function attachCspNonce(req, res, next) {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
}

/**
 * Creates security middleware bundle (Helmet, CORS, rate limiters).
 * @returns {object} Security middleware functions.
 */
function createSecurityMiddleware() {
  const helmetMiddleware = (req, res, next) => {
    const nonce = res.locals.cspNonce || crypto.randomBytes(16).toString('base64');
    return helmet({
      hsts: {
        maxAge: HSTS.MAX_AGE,
        includeSubDomains: HSTS.INCLUDE_SUBDOMAINS,
        preload: HSTS.PRELOAD,
      },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://unpkg.com', `'nonce-${nonce}'`],
          styleSrc: ["'self'", 'https://fonts.googleapis.com', 'https://unpkg.com', `'nonce-${nonce}'`],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false,
    })(req, res, next);
  };

  const corsMiddleware = cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const isAllowed = ALLOWED_ORIGINS.includes(origin)
        || origin.startsWith('http://localhost')
        || origin.startsWith('http://127.0.0.1');
      if (isAllowed) return callback(null, true);
      return callback(new Error('Not allowed by CORS'), false);
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  return { helmetMiddleware, corsMiddleware, ...createRateLimiters() };
}

/**
 * Applies global security middleware to an Express application.
 * @param {import('express').Application} app - Express application instance.
 * @returns {{ analyzeLimiter: Function, chatLimiter: Function, generalLimiter: Function }}
 */
function applySecurityMiddleware(app) {
  const {
    helmetMiddleware,
    corsMiddleware,
    generalLimiter,
    analyzeLimiter,
    chatLimiter,
  } = createSecurityMiddleware();

  app.use(attachCspNonce);
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use('/api/', generalLimiter);

  return { analyzeLimiter, chatLimiter, generalLimiter };
}

module.exports = {
  applySecurityMiddleware,
  createSecurityMiddleware,
  createRateLimiters,
  attachCspNonce,
};
