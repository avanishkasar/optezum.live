'use strict';

const {
  cleanInput,
  sanitizeString,
  truncateString,
  validateJournalForm,
  validateChatMessage,
  validateWeeklyEntries,
  validateCopingRequest,
  validateChatHistory,
  formatValidationError,
  MAX_API_TEXT_LENGTH,
} = require('../../public/js/utils/validation-core');
const { VALIDATION } = require('../../shared/constants');

/**
 * Express middleware that validates and sanitizes journal analysis input.
 *
 * Expected body: `{ entry, mood, stressLevel, sleepHours?, studyHours?, examType? }`
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {void}
 */
function validateJournalInput(req, res, next) {
  try {
    const { entry, mood, stressLevel, sleepHours, studyHours, examType } = req.body || {};
    const result = validateJournalForm(
      { entry, mood, stressLevel, sleepHours, studyHours, examType },
      { minEntryLength: VALIDATION.MIN_SERVER_ENTRY_LENGTH, allowStringMood: true, requireStressLevel: true },
    );

    if (!result.valid) {
      return res.status(400).json({ error: formatValidationError(result.errors) });
    }

    req.body.entry = cleanInput(entry);
    req.body.mood = typeof mood === 'string' ? cleanInput(mood) : mood;
    if (typeof examType === 'string') {
      req.body.examType = cleanInput(examType);
    }

    next();
  } catch {
    return res.status(400).json({ error: 'Validation error: malformed request body.' });
  }
}

/**
 * Express middleware that validates and sanitizes chat input.
 *
 * Expected body: `{ message, history?: Array<{role, parts}> }`
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {void}
 */
function validateChatInput(req, res, next) {
  try {
    const { message, history } = req.body || {};
    const messageResult = validateChatMessage(message, { maxLength: MAX_API_TEXT_LENGTH });

    if (!messageResult.valid) {
      return res.status(400).json({ error: formatValidationError(messageResult.errors) });
    }

    const historyResult = validateChatHistory(history);
    if (!historyResult.valid) {
      return res.status(400).json({ error: formatValidationError(historyResult.errors) });
    }

    req.body.message = cleanInput(message);
    next();
  } catch {
    return res.status(400).json({ error: 'Validation error: malformed request body.' });
  }
}

/**
 * Express middleware that validates weekly insights input.
 *
 * Expected body: `{ entries: Array }`
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {void}
 */
function validateWeeklyInput(req, res, next) {
  try {
    const { entries } = req.body || {};
    const result = validateWeeklyEntries(entries);

    if (!result.valid) {
      return res.status(400).json({ error: formatValidationError(result.errors) });
    }

    req.body.entries = entries.map((e) => {
      if (typeof e === 'string') return cleanInput(e);
      if (e && typeof e.entry === 'string') e.entry = cleanInput(e.entry);
      if (e && typeof e.journalText === 'string') e.journalText = cleanInput(e.journalText);
      if (e && typeof e.text === 'string') e.text = cleanInput(e.text);
      if (e && typeof e.mood === 'string') e.mood = cleanInput(e.mood);
      return e;
    });

    next();
  } catch {
    return res.status(400).json({ error: 'Validation error: malformed request body.' });
  }
}

/**
 * Express middleware that validates coping strategy input.
 *
 * Expected body: `{ stressType, examType? }` or `{ type, examType? }`
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next function.
 * @returns {void}
 */
function validateCopingInput(req, res, next) {
  try {
    let { stressType, examType, type } = req.body || {};

    if (!stressType && type) {
      stressType = type;
      req.body.stressType = type;
    }

    const result = validateCopingRequest({ stressType, type });
    if (!result.valid) {
      return res.status(400).json({ error: formatValidationError(result.errors) });
    }

    req.body.stressType = cleanInput(stressType);
    if (typeof examType === 'string') {
      req.body.examType = cleanInput(examType);
    }

    next();
  } catch {
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
  MAX_TEXT_LENGTH: MAX_API_TEXT_LENGTH,
};
