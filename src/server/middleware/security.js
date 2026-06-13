'use strict';

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

/**
 * Creates and returns an array of security middleware for the Express app.
 *
 * Includes:
 * - **helmet** with a strict Content-Security-Policy that allows Google Fonts
 *   and the unpkg CDN (for Lucide icons).
 * - **express-rate-limit** scoped to `/api/` routes — 100 requests per 15-minute window.
 * - **cors** configured to accept requests from the same origin by default.
 *
 * @returns {{ helmetMiddleware: Function, limiter: Function, corsMiddleware: Function }}
 *   Individual middleware functions for flexible mounting.
 */
function createSecurityMiddleware() {
  const helmetMiddleware = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://unpkg.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  });

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests. Please try again after 15 minutes.',
    },
  });

  const corsMiddleware = cors({
    origin: true,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  return { helmetMiddleware, limiter, corsMiddleware };
}

/**
 * Applies all security middleware to an Express app.
 *
 * @param {import('express').Application} app - The Express application instance.
 */
function applySecurityMiddleware(app) {
  const { helmetMiddleware, limiter, corsMiddleware } = createSecurityMiddleware();

  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use('/api/', limiter);
}

module.exports = { applySecurityMiddleware, createSecurityMiddleware };
