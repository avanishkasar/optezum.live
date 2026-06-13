'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { applySecurityMiddleware } = require('./middleware/security');
const { errorHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes/api');
const { SERVER, HTTP_STATUS } = require('../shared/constants');

/**
 * The main Express application instance for Optezum.
 * @type {import('express').Application}
 */
const app = express();

/** Absolute path to static public assets (uses __dirname, not process.cwd). @type {string} */
const publicPath = path.join(__dirname, '..', 'public');

/** Absolute path to shared modules served to the browser. @type {string} */
const sharedPath = path.join(__dirname, '..', 'shared');

const { analyzeLimiter, chatLimiter } = applySecurityMiddleware(app);

app.use(express.json({ limit: SERVER.JSON_BODY_LIMIT }));
app.use(express.urlencoded({ extended: false, limit: SERVER.JSON_BODY_LIMIT }));

app.use(express.static(publicPath));
app.use('/shared', express.static(sharedPath));

/**
 * GET /health — lightweight health check for load balancers and CI.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {void}
 */
app.get('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiRoutes(analyzeLimiter, chatLimiter));

/**
 * Serves index.html with a CSP nonce injected for any inline needs.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @returns {void}
 */
app.get('*', (req, res, next) => {
  const indexPath = path.join(publicPath, 'index.html');
  fs.readFile(indexPath, 'utf8', (err, html) => {
    if (err) return next(err);
    const nonce = res.locals.cspNonce || '';
    const withNonce = html.replace(/<script /g, `<script nonce="${nonce}" `);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(withNonce);
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || SERVER.DEFAULT_PORT;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console -- startup logging
    console.log(`✅ Optezum server running on http://localhost:${PORT}`);
    // eslint-disable-next-line no-console -- startup logging
    console.log(`📁 Serving static files from ${publicPath}`);
  });
}

module.exports = { app };
