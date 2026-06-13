'use strict';

/**
 * Maximum allowed length for any text input field.
 * @type {number}
 */
const MAX_TEXT_LENGTH = 2000;

/**
 * Strips HTML tags from a string and trims whitespace.
 * @param {string} str - The raw input string.
 * @returns {string} Sanitized string with HTML tags removed.
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

/**
 * Truncates a string to the maximum allowed length.
 * @param {string} str - The string to truncate.
 * @param {number} [maxLength=2000] - Maximum character count.
 * @returns {string} The truncated string.
 */
function truncateString(str, maxLength = MAX_TEXT_LENGTH) {
  if (typeof str !== 'string') return '';
  return str.length > maxLength ? str.slice(0, maxLength) : str;
}

/**
 * Sanitizes and truncates a string input.
 * @param {string} str - The raw input.
 * @returns {string} Clean, length-limited string.
 */
function cleanInput(str) {
  return truncateString(sanitizeString(str));
}

/**
 * Express middleware that validates and sanitizes journal analysis input.
 *
 * Expected body: { entry, mood, stressLevel, sleepHours?, studyHours?, examType? }
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 */
function validateJournalInput(req, res, next) {
  try {
    const { entry, mood, stressLevel, sleepHours, studyHours, examType } = req.body || {};

    // Required fields
    if (typeof entry !== 'string' || entry.trim().length === 0) {
      return res.status(400).json({ error: 'Validation failed: "entry" must be a non-empty string.' });
    }
    if (typeof mood !== 'string' && typeof mood !== 'number') {
      return res.status(400).json({ error: 'Validation failed: "mood" must be a string or a number.' });
    }
    if (typeof mood === 'string' && mood.trim().length === 0) {
      return res.status(400).json({ error: 'Validation failed: "mood" must be a non-empty string.' });
    }
    if (typeof mood === 'number' && (mood < 1 || mood > 5)) {
      return res.status(400).json({ error: 'Validation failed: "mood" must be between 1 and 5.' });
    }
    if (typeof stressLevel !== 'number' || !Number.isFinite(stressLevel) || stressLevel < 1 || stressLevel > 10) {
      return res.status(400).json({ error: 'Validation failed: "stressLevel" must be a number between 1 and 10.' });
    }

    // Optional numeric fields
    if (sleepHours !== undefined && sleepHours !== null) {
      if (typeof sleepHours !== 'number' || !Number.isFinite(sleepHours) || sleepHours < 0 || sleepHours > 24) {
        return res.status(400).json({ error: 'Validation failed: "sleepHours" must be a number between 0 and 24.' });
      }
    }
    if (studyHours !== undefined && studyHours !== null) {
      if (typeof studyHours !== 'number' || !Number.isFinite(studyHours) || studyHours < 0 || studyHours > 24) {
        return res.status(400).json({ error: 'Validation failed: "studyHours" must be a number between 0 and 24.' });
      }
    }

    // Sanitize string inputs
    req.body.entry = cleanInput(entry);
    if (typeof mood === 'string') {
      req.body.mood = cleanInput(mood);
    } else {
      req.body.mood = mood;
    }
    if (typeof examType === 'string') {
      req.body.examType = cleanInput(examType);
    }

    next();
  } catch (err) {
    return res.status(400).json({ error: 'Validation error: malformed request body.' });
  }
}

/**
 * Express middleware that validates and sanitizes chat input.
 *
 * Expected body: { message, history?: Array<{role, parts}> }
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 */
function validateChatInput(req, res, next) {
  try {
    const { message, history } = req.body || {};

    if (typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Validation failed: "message" must be a non-empty string.' });
    }

    if (history !== undefined && history !== null) {
      if (!Array.isArray(history)) {
        return res.status(400).json({ error: 'Validation failed: "history" must be an array.' });
      }
      // Validate each history entry
      for (let i = 0; i < history.length; i++) {
        const h = history[i];
        if (!h || typeof h.role !== 'string') {
          return res.status(400).json({
            error: `Validation failed: history[${i}] must have a "role" string.`,
          });
        }
      }
    }

    // Sanitize
    req.body.message = cleanInput(message);

    next();
  } catch (err) {
    return res.status(400).json({ error: 'Validation error: malformed request body.' });
  }
}

/**
 * Express middleware that validates weekly insights input.
 *
 * Expected body: { entries: Array }
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 */
function validateWeeklyInput(req, res, next) {
  try {
    const { entries } = req.body || {};

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ error: 'Validation failed: "entries" must be a non-empty array.' });
    }

    // Sanitize text fields inside each entry
    req.body.entries = entries.map((e) => {
      if (typeof e === 'string') return cleanInput(e);
      if (e && typeof e.entry === 'string') {
        e.entry = cleanInput(e.entry);
      }
      if (e && typeof e.journalText === 'string') {
        e.journalText = cleanInput(e.journalText);
      }
      if (e && typeof e.text === 'string') {
        e.text = cleanInput(e.text);
      }
      if (e && typeof e.mood === 'string') {
        e.mood = cleanInput(e.mood);
      }
      return e;
    });

    next();
  } catch (err) {
    return res.status(400).json({ error: 'Validation error: malformed request body.' });
  }
}

/**
 * Express middleware that validates coping strategy input.
 *
 * Expected body: { stressType, examType? }
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 */
function validateCopingInput(req, res, next) {
  try {
    let { stressType, examType, type } = req.body || {};

    if (!stressType && type) {
      stressType = type;
      req.body.stressType = type;
    }

    if (typeof stressType !== 'string' || stressType.trim().length === 0) {
      return res.status(400).json({ error: 'Validation failed: "stressType" must be a non-empty string.' });
    }

    // Sanitize
    req.body.stressType = cleanInput(stressType);
    if (typeof examType === 'string') {
      req.body.examType = cleanInput(examType);
    }

    next();
  } catch (err) {
    return res.status(400).json({ error: 'Validation error: malformed request body.' });
  }
}

module.exports = {
  validateJournalInput,
  validateChatInput,
  validateWeeklyInput,
  validateCopingInput,
  sanitizeString,
  truncateString,
  cleanInput,
  MAX_TEXT_LENGTH,
};
