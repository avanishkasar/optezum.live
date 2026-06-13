/**
 * @module sanitizer
 * @description HTML sanitization utilities to prevent XSS attacks.
 * All user-facing text MUST pass through these before DOM insertion.
 */
'use strict';

/**
 * Escapes HTML special characters to prevent XSS injection.
 * Converts &, <, >, ", and ' to their HTML entity equivalents.
 * @param {string} str - The raw string to escape.
 * @returns {string} The escaped string safe for DOM insertion.
 */
function escapeHtml(str) {
  if (str == null || typeof str !== 'string') return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return str.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Sanitizes user input by stripping HTML tags, trimming whitespace,
 * and enforcing a maximum character length.
 * @param {string} str - The raw input string to sanitize.
 * @param {number} [maxLength=2000] - Maximum allowed character length.
 * @returns {string} The sanitized, trimmed, and length-limited string.
 */
function sanitizeInput(str, maxLength = 2000) {
  if (str == null || typeof str !== 'string') return '';
  const stripped = str.replace(/<[^>]*>/g, '');
  const trimmed = stripped.trim();
  return trimmed.slice(0, maxLength);
}

// Export for Node.js testing, no-op in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { escapeHtml, sanitizeInput };
}
