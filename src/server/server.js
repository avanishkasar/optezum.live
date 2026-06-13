'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path');
const { applySecurityMiddleware } = require('./middleware/security');
const apiRoutes = require('./routes/api');

/**
 * The main Express application instance for Optezum.
 * @type {import('express').Application}
 */
const app = express();

/* ---------- Security middleware ---------- */
applySecurityMiddleware(app);

/* ---------- Body parsing ---------- */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

/* ---------- Static files ---------- */
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

/* ---------- API routes ---------- */
app.use('/api', apiRoutes);

/* ---------- Catch-all: serve index.html for SPA routing ---------- */
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

/* ---------- Global error handler ---------- */

/**
 * Global Express error-handling middleware.
 * Catches unhandled errors and returns a clean JSON response.
 *
 * @param {Error} err - The error object.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} _next - Express next function.
 */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

/* ---------- Conditional listen ---------- */
const PORT = process.env.PORT || 8080;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`✅ Optezum server running on http://localhost:${PORT}`);
    console.log(`📁 Serving static files from ${publicPath}`);
  });
}

module.exports = { app };
